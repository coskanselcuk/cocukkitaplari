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


# ========================================
# Complete Book Creation API
# ========================================

from pydantic import BaseModel
from typing import List, Optional
import uuid

class PageInput(BaseModel):
    text: str
    imageUrl: str
    voiceId: Optional[str] = None

class CompleteBookCreate(BaseModel):
    """Schema for creating a complete book with all pages in one request"""
    title: str
    author: str = "Çocuk Kitapları"
    category: str = "bizim-masallar"
    coverImage: str
    description: Optional[str] = ""
    ageGroup: str = "4-6"
    duration: str = "5 dk"
    isPremium: bool = False
    isNew: bool = True
    pages: List[PageInput]
    defaultVoiceId: Optional[str] = None  # Voice to use for pages without voiceId
    generateAudio: bool = False  # Whether to generate audio immediately

class CompleteBookResponse(BaseModel):
    success: bool
    book: dict
    pages_created: int
    audio_status: str


@router.post("/books/create-complete", response_model=CompleteBookResponse)
async def create_complete_book(book_data: CompleteBookCreate):
    """
    Create a complete book with all pages in a single API call.
    
    This endpoint allows programmatic creation of books with:
    - Book metadata (title, author, category, etc.)
    - All pages with text and images
    - Optional voice assignment per page or default voice
    - Optional immediate audio generation
    
    Example request:
    ```json
    {
        "title": "Küçük Prens",
        "author": "Antoine de Saint-Exupéry",
        "category": "klasik-masallar",
        "coverImage": "https://example.com/cover.jpg",
        "ageGroup": "6-8",
        "pages": [
            {"text": "Bir varmış bir yokmuş...", "imageUrl": "https://example.com/page1.jpg"},
            {"text": "Uzak diyarlarda...", "imageUrl": "https://example.com/page2.jpg"}
        ],
        "defaultVoiceId": "NsFK0aDGLbVusA7tQfOB",
        "generateAudio": false
    }
    ```
    """
    db = get_db()
    
    # Generate book ID
    book_id = str(uuid.uuid4())
    
    # Create book document
    book_doc = {
        "id": book_id,
        "title": book_data.title,
        "author": book_data.author,
        "category": book_data.category,
        "coverImage": book_data.coverImage,
        "description": book_data.description or "",
        "ageGroup": book_data.ageGroup,
        "duration": book_data.duration,
        "isPremium": book_data.isPremium,
        "isNew": book_data.isNew,
        "hasAudio": False,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert book
    await db.books.insert_one(book_doc)
    
    # Create pages
    pages_created = 0
    for idx, page_input in enumerate(book_data.pages):
        page_id = str(uuid.uuid4())
        voice_id = page_input.voiceId or book_data.defaultVoiceId
        
        page_doc = {
            "id": page_id,
            "bookId": book_id,
            "pageNumber": idx + 1,
            "text": page_input.text,
            "imageUrl": page_input.imageUrl,
            "voiceId": voice_id,
            "audioUrl": None
        }
        
        await db.pages.insert_one(page_doc)
        pages_created += 1
    
    # Generate audio if requested
    audio_status = "not_requested"
    if book_data.generateAudio and pages_created > 0:
        audio_status = "queued"
        try:
            # Generate audio for all pages
            success_count = 0
            error_count = 0
            
            cursor = db.pages.find({"bookId": book_id}).sort("pageNumber", 1)
            pages = await cursor.to_list(length=1000)
            
            for page in pages:
                page_id = page.get('id')
                text = page.get('text', '')
                voice_id = page.get('voiceId') or book_data.defaultVoiceId
                
                if not text:
                    continue
                
                try:
                    result = await generate_tts_audio(text, voice_id)
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
                book_doc["hasAudio"] = True
            
            audio_status = f"completed: {success_count} success, {error_count} errors"
            
        except Exception as e:
            logger.error(f"Error generating audio for book {book_id}: {e}")
            audio_status = f"error: {str(e)}"
    
    # Remove MongoDB _id from response
    book_doc.pop("_id", None)
    
    return CompleteBookResponse(
        success=True,
        book=book_doc,
        pages_created=pages_created,
        audio_status=audio_status
    )


@router.post("/books/create-from-text")
async def create_book_from_text(
    title: str,
    text: str,
    separator: str = "---",
    category: str = "bizim-masallar",
    cover_image: str = "",
    default_voice_id: Optional[str] = None,
    generate_audio: bool = False
):
    """
    Create a book by splitting a single text into pages.
    
    The text is split by the specified separator (default: '---').
    Each segment becomes a page. Images must be added separately.
    
    Query Parameters:
    - title: Book title
    - text: Full story text with separators
    - separator: Page separator (default: '---')
    - category: Category slug
    - cover_image: Cover image URL
    - default_voice_id: Voice ID for all pages
    - generate_audio: Whether to generate audio
    
    Example:
    POST /api/admin/books/create-from-text?title=My%20Story&separator=---
    Body: "Page 1 text---Page 2 text---Page 3 text"
    """
    db = get_db()
    
    # Split text into pages
    page_texts = [p.strip() for p in text.split(separator) if p.strip()]
    
    if not page_texts:
        raise HTTPException(status_code=400, detail="No pages found after splitting text")
    
    # Generate book ID
    book_id = str(uuid.uuid4())
    
    # Create book document
    book_doc = {
        "id": book_id,
        "title": title,
        "author": "Çocuk Kitapları",
        "category": category,
        "coverImage": cover_image,
        "description": "",
        "ageGroup": "4-6",
        "duration": f"{len(page_texts) * 2} dk",  # Estimate 2 min per page
        "isPremium": False,
        "isNew": True,
        "hasAudio": False,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.books.insert_one(book_doc)
    
    # Create pages (without images - must be added separately)
    pages_info = []
    for idx, page_text in enumerate(page_texts):
        page_id = str(uuid.uuid4())
        
        page_doc = {
            "id": page_id,
            "bookId": book_id,
            "pageNumber": idx + 1,
            "text": page_text,
            "imageUrl": "",  # To be filled later
            "voiceId": default_voice_id,
            "audioUrl": None
        }
        
        await db.pages.insert_one(page_doc)
        pages_info.append({
            "page_number": idx + 1,
            "page_id": page_id,
            "text_preview": page_text[:100] + "..." if len(page_text) > 100 else page_text
        })
    
    book_doc.pop("_id", None)
    
    return {
        "success": True,
        "book_id": book_id,
        "book": book_doc,
        "pages_created": len(pages_info),
        "pages": pages_info,
        "note": "Images must be added to each page separately via PUT /api/books/{book_id}/pages/{page_id}"
    }
