from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os

from models.progress import (
    ReadingProgress, ProgressUpdateRequest, ProgressCompleteRequest,
    UserProgressResponse, BookProgressResponse, ProgressSaveResponse, ProgressCompleteResponse
)

router = APIRouter(prefix="/progress", tags=["progress"])

# Get database from environment
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


@router.get("/{user_id}", response_model=UserProgressResponse)
async def get_user_progress(user_id: str):
    """Get reading progress for a user"""
    db = get_db()
    
    # Get all progress entries for user
    cursor = db.reading_progress.find({"userId": user_id}, {"_id": 0})
    progress_list = await cursor.to_list(length=1000)
    
    books_progress = []
    for progress in progress_list:
        # Get book details
        book = await db.books.find_one({"id": progress["bookId"]}, {"_id": 0})
        if book:
            books_progress.append(BookProgressResponse(
                bookId=progress["bookId"],
                bookTitle=book.get("title", "Unknown"),
                currentPage=progress["currentPage"],
                totalPages=book.get("totalPages", 0),
                isCompleted=progress.get("isCompleted", False),
                lastReadAt=progress.get("lastReadAt", "")
            ))
    
    return UserProgressResponse(userId=user_id, books=books_progress)


@router.post("", response_model=ProgressSaveResponse)
async def save_progress(data: ProgressUpdateRequest):
    """Save reading progress for a book"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Upsert progress
    await db.reading_progress.update_one(
        {"userId": data.userId, "bookId": data.bookId},
        {
            "$set": {
                "currentPage": data.currentPage,
                "lastReadAt": now
            },
            "$setOnInsert": {
                "id": f"{data.userId}_{data.bookId}",
                "isCompleted": False,
                "completedAt": None,
                "totalReadTime": 0
            }
        },
        upsert=True
    )
    
    return ProgressSaveResponse(
        success=True,
        progress={
            "bookId": data.bookId,
            "currentPage": data.currentPage,
            "lastReadAt": now
        }
    )


@router.post("/complete", response_model=ProgressCompleteResponse)
async def complete_book(data: ProgressCompleteRequest):
    """Mark a book as completed"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update progress to completed
    await db.reading_progress.update_one(
        {"userId": data.userId, "bookId": data.bookId},
        {
            "$set": {
                "isCompleted": True,
                "completedAt": now,
                "lastReadAt": now
            }
        }
    )
    
    # Check if progress exists, if not create it
    existing = await db.reading_progress.find_one({"userId": data.userId, "bookId": data.bookId})
    if not existing:
        # Create new completed entry if doesn't exist
        await db.reading_progress.insert_one({
            "id": f"{data.userId}_{data.bookId}",
            "userId": data.userId,
            "bookId": data.bookId,
            "currentPage": 0,
            "isCompleted": True,
            "completedAt": now,
            "lastReadAt": now,
            "totalReadTime": 0
        })
    
    # Increment book's read count
    await db.books.update_one(
        {"id": data.bookId},
        {"$inc": {"readCount": 1}}
    )
    
    return ProgressCompleteResponse(
        success=True,
        message="Book marked as completed"
    )


@router.delete("/{user_id}/{book_id}")
async def delete_progress(user_id: str, book_id: str):
    """Delete reading progress for a specific book"""
    db = get_db()
    
    result = await db.reading_progress.delete_one({
        "userId": user_id,
        "bookId": book_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Progress not found")
    
    return {"success": True, "message": "Progress deleted"}
