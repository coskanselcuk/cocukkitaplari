from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import json

from services.tts_service import generate_tts_audio
from routes.notification_routes import notify_new_book, notify_new_category

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


@router.post("/generate-audio/{book_id}")
async def generate_audio_for_book(book_id: str, voice_id: str = None, regenerate_all: bool = False):
    """Generate TTS audio for all pages of a book that don't have audio yet
    
    Args:
        book_id: The book ID
        voice_id: Optional voice ID to use for all pages (overrides page-specific voices)
        regenerate_all: If True, regenerate audio for all pages even if they already have audio
    """
    db = get_db()
    
    # Build query based on regenerate_all flag
    query = {"bookId": book_id}
    if not regenerate_all:
        query["$or"] = [{"audioUrl": None}, {"audioUrl": {"$exists": False}}, {"audioUrl": ""}]
    
    cursor = db.pages.find(query).sort("pageNumber", 1)
    pages = await cursor.to_list(length=1000)
    
    if not pages:
        # Check if any pages exist
        total = await db.pages.count_documents({"bookId": book_id})
        if total == 0:
            raise HTTPException(status_code=404, detail="No pages found for this book")
        return {"message": "All pages already have audio", "success_count": 0, "error_count": 0, "total": total}
    
    success_count = 0
    error_count = 0
    total_pages = len(pages)
    
    for page in pages:
        page_id = page.get('id')
        text = page.get('text', '')
        # Use provided voice_id, or page-specific voice, or None (default)
        page_voice_id = voice_id or page.get('voiceId')
        
        if not text:
            continue
        
        try:
            result = await generate_tts_audio(text, page_voice_id)
            audio_url = result.get('audio_url')
            
            if audio_url:
                await db.pages.update_one(
                    {"id": page_id},
                    {"$set": {"audioUrl": audio_url}}
                )
                success_count += 1
        except Exception as e:
            logger.error(f"Error generating audio for page {page_id}: {e}")
            error_count += 1
    
    # Update book hasAudio flag
    if success_count > 0:
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"hasAudio": True}}
        )
    
    return {
        "message": f"Audio generated for {success_count} pages",
        "success_count": success_count,
        "error_count": error_count,
        "total": total_pages
    }


@router.get("/generate-audio-stream/{book_id}")
async def generate_audio_stream(book_id: str, voice_id: str = None, regenerate_all: bool = False):
    """Generate TTS audio with real-time progress streaming via SSE
    
    Args:
        book_id: The book ID
        voice_id: Optional voice ID to use for all pages
        regenerate_all: If True, regenerate audio for all pages
    """
    
    async def event_generator():
        db = get_db()
        
        # Build query based on regenerate_all flag
        query = {"bookId": book_id}
        if not regenerate_all:
            query["$or"] = [{"audioUrl": None}, {"audioUrl": {"$exists": False}}, {"audioUrl": ""}]
        
        cursor = db.pages.find(query).sort("pageNumber", 1)
        pages = await cursor.to_list(length=1000)
        
        total_pages = len(pages)
        
        if not pages:
            total = await db.pages.count_documents({"bookId": book_id})
            if total == 0:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No pages found'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'complete', 'message': 'All pages already have audio', 'success': 0, 'errors': 0, 'total': total})}\n\n"
            return
        
        # Send initial status
        yield f"data: {json.dumps({'type': 'start', 'total': total_pages, 'message': f'Generating audio for {total_pages} pages...'})}\n\n"
        
        success_count = 0
        error_count = 0
        
        for idx, page in enumerate(pages):
            page_id = page.get('id')
            page_num = page.get('pageNumber', idx + 1)
            text = page.get('text', '')
            page_voice_id = voice_id or page.get('voiceId')
            
            if not text:
                error_count += 1
                yield f"data: {json.dumps({'type': 'progress', 'current': idx + 1, 'total': total_pages, 'page': page_num, 'status': 'skipped', 'message': 'No text'})}\n\n"
                continue
            
            try:
                # Send generating status
                yield f"data: {json.dumps({'type': 'progress', 'current': idx + 1, 'total': total_pages, 'page': page_num, 'status': 'generating'})}\n\n"
                
                result = await generate_tts_audio(text, page_voice_id)
                audio_url = result.get('audio_url')
                
                if audio_url:
                    await db.pages.update_one(
                        {"id": page_id},
                        {"$set": {"audioUrl": audio_url}}
                    )
                    success_count += 1
                    yield f"data: {json.dumps({'type': 'progress', 'current': idx + 1, 'total': total_pages, 'page': page_num, 'status': 'success'})}\n\n"
                else:
                    error_count += 1
                    yield f"data: {json.dumps({'type': 'progress', 'current': idx + 1, 'total': total_pages, 'page': page_num, 'status': 'error', 'message': 'No audio URL returned'})}\n\n"
                    
            except Exception as e:
                logger.error(f"Error generating audio for page {page_id}: {e}")
                error_count += 1
                yield f"data: {json.dumps({'type': 'progress', 'current': idx + 1, 'total': total_pages, 'page': page_num, 'status': 'error', 'message': str(e)[:100]})}\n\n"
            
            # Small delay to prevent overwhelming the API
            await asyncio.sleep(0.1)
        
        # Update book hasAudio flag
        if success_count > 0:
            await db.books.update_one(
                {"id": book_id},
                {"$set": {"hasAudio": True}}
            )
        
        # Send completion status
        yield f"data: {json.dumps({'type': 'complete', 'success': success_count, 'errors': error_count, 'total': total_pages, 'message': f'Completed: {success_count} success, {error_count} errors'})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/generate-audio/{book_id}/page/{page_id}")
async def generate_audio_for_page(book_id: str, page_id: str):
    """Generate TTS audio for a single page"""
    db = get_db()
    
    # Find the page
    page = await db.pages.find_one({"id": page_id, "bookId": book_id})
    
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    text = page.get('text', '')
    if not text:
        raise HTTPException(status_code=400, detail="Page has no text")
    
    voice_id = page.get('voiceId')  # Use page-specific voice if set
    
    try:
        result = await generate_tts_audio(text, voice_id)
        audio_url = result.get('audio_url')
        
        if audio_url:
            await db.pages.update_one(
                {"id": page_id},
                {"$set": {"audioUrl": audio_url}}
            )
            return {"success": True, "message": "Audio generated successfully", "audioUrl": audio_url}
        else:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating audio: {str(e)}")


@router.delete("/books/{book_id}")
async def delete_book(book_id: str):
    """Delete a book and all its pages"""
    db = get_db()
    
    # Delete pages
    await db.pages.delete_many({"bookId": book_id})
    
    # Delete book
    result = await db.books.delete_one({"id": book_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return {"message": "Book deleted successfully"}


@router.delete("/pages/{page_id}")
async def delete_page(page_id: str):
    """Delete a single page"""
    db = get_db()
    
    result = await db.pages.delete_one({"id": page_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"message": "Page deleted successfully"}
