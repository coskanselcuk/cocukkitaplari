from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os

from services.tts_service import generate_tts_audio
from routes.notification_routes import notify_new_book, notify_new_category

router = APIRouter(prefix="/admin", tags=["admin"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


@router.post("/generate-audio/{book_id}")
async def generate_audio_for_book(book_id: str):
    """Generate TTS audio for all pages of a book that don't have audio yet"""
    db = get_db()
    
    # Find pages without audio
    cursor = db.pages.find({
        "bookId": book_id,
        "$or": [{"audioUrl": None}, {"audioUrl": {"$exists": False}}]
    })
    pages = await cursor.to_list(length=1000)
    
    if not pages:
        # Check if any pages exist
        total = await db.pages.count_documents({"bookId": book_id})
        if total == 0:
            raise HTTPException(status_code=404, detail="No pages found for this book")
        return {"message": "All pages already have audio", "success_count": 0, "error_count": 0}
    
    success_count = 0
    error_count = 0
    
    for page in pages:
        page_id = page.get('id')
        text = page.get('text', '')
        
        if not text:
            continue
        
        try:
            result = await generate_tts_audio(text)
            audio_url = result.get('audio_url')
            
            if audio_url:
                await db.pages.update_one(
                    {"id": page_id},
                    {"$set": {"audioUrl": audio_url}}
                )
                success_count += 1
        except Exception as e:
            print(f"Error generating audio for page {page_id}: {e}")
            error_count += 1
    
    return {
        "message": f"Audio generated for {success_count} pages",
        "success_count": success_count,
        "error_count": error_count
    }


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
    
    try:
        result = await generate_tts_audio(text)
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
