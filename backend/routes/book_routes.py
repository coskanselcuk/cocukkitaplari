from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone
import os

from models.book import (
    Book, BookCreate, BookResponse, BooksListResponse,
    Page, PageCreate, PageResponse, BookPagesResponse
)
from routes.notification_routes import notify_new_book


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    coverImage: Optional[str] = None
    description: Optional[str] = None
    ageGroup: Optional[str] = None
    duration: Optional[str] = None
    isPremium: Optional[bool] = None
    isNew: Optional[bool] = None


class PageUpdate(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None
    pageNumber: Optional[int] = None
    voiceId: Optional[str] = None

router = APIRouter(prefix="/books", tags=["books"])

# Get database from environment
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


@router.get("", response_model=BooksListResponse)
async def get_books(
    category: Optional[str] = Query(None, description="Filter by category slug"),
    ageGroup: Optional[str] = Query(None, description="Filter by age group"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all books with optional filtering"""
    db = get_db()
    
    # Build query
    query = {}
    if category:
        query["category"] = category
    if ageGroup:
        query["ageGroup"] = ageGroup
    
    # Get total count
    total = await db.books.count_documents(query)
    
    # Get books with pagination
    cursor = db.books.find(query, {"_id": 0}).skip(offset).limit(limit)
    books = await cursor.to_list(length=limit)
    
    return BooksListResponse(
        books=[BookResponse(**book) for book in books],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: str):
    """Get a single book by ID"""
    db = get_db()
    
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return BookResponse(**book)


@router.get("/{book_id}/pages", response_model=BookPagesResponse)
async def get_book_pages(book_id: str):
    """Get all pages for a book"""
    db = get_db()
    
    # Verify book exists
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get pages sorted by page number
    cursor = db.pages.find({"bookId": book_id}, {"_id": 0}).sort("pageNumber", 1)
    pages = await cursor.to_list(length=1000)
    
    return BookPagesResponse(
        bookId=book_id,
        pages=[PageResponse(**page) for page in pages]
    )


@router.post("", response_model=BookResponse)
async def create_book(book_data: BookCreate):
    """Create a new book (admin endpoint)"""
    db = get_db()
    
    book = Book(**book_data.model_dump())
    doc = book.model_dump()
    
    # Convert datetime to ISO string for MongoDB
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['updatedAt'] = doc['updatedAt'].isoformat()
    
    await db.books.insert_one(doc)
    
    # Create notification for new book
    try:
        await notify_new_book(
            book_title=doc.get('title', 'Yeni Kitap'),
            book_id=doc.get('id'),
            is_premium=doc.get('isPremium', False)
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")
    
    return BookResponse(**doc)


@router.post("/{book_id}/pages", response_model=PageResponse)
async def create_page(book_id: str, page_data: PageCreate):
    """Create a new page for a book (admin endpoint)"""
    db = get_db()
    
    # Verify book exists
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get the target page number
    target_page_num = page_data.pageNumber
    
    # Shift existing pages if inserting in the middle
    await db.pages.update_many(
        {"bookId": book_id, "pageNumber": {"$gte": target_page_num}},
        {"$inc": {"pageNumber": 1}}
    )
    
    page = Page(bookId=book_id, **page_data.model_dump(exclude={"bookId"}))
    doc = page.model_dump()
    
    await db.pages.insert_one(doc)
    
    # Update book's total pages
    total_pages = await db.pages.count_documents({"bookId": book_id})
    await db.books.update_one({"id": book_id}, {"$set": {"totalPages": total_pages}})
    
    return PageResponse(**doc)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book_data: BookUpdate):
    """Update a book"""
    db = get_db()
    
    # Check if book exists
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Build update dict with only provided fields
    update_data = {k: v for k, v in book_data.model_dump().items() if v is not None}
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.books.update_one({"id": book_id}, {"$set": update_data})
    
    # Return updated book
    updated_book = await db.books.find_one({"id": book_id}, {"_id": 0})
    return BookResponse(**updated_book)


@router.put("/{book_id}/pages/{page_id}", response_model=PageResponse)
async def update_page(book_id: str, page_id: str, page_data: PageUpdate):
    """Update a page - clears audio if text or voice changes"""
    db = get_db()
    
    # Check if page exists
    page = await db.pages.find_one({"id": page_id, "bookId": book_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Build update dict with only provided fields (allow empty strings for voiceId)
    update_data = {}
    for k, v in page_data.model_dump().items():
        if k == "voiceId":
            # For voiceId, include it even if empty string (to clear the voice)
            if v is not None:
                update_data[k] = v if v != "" else None
        elif v is not None:
            update_data[k] = v
    
    # Check if text is being changed - clear audio
    text_changed = "text" in update_data and update_data["text"] != page.get("text", "")
    
    # Check if voice is being changed - clear audio
    voice_changed = "voiceId" in update_data and update_data.get("voiceId") != page.get("voiceId")
    
    # If text or voice changes, clear the audio (it needs to be regenerated)
    if text_changed or voice_changed:
        update_data["audioUrl"] = None  # Clear audio when text or voice changes
    
    if update_data:
        await db.pages.update_one({"id": page_id}, {"$set": update_data})
    
    # Return updated page
    updated_page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    return PageResponse(**updated_page)


@router.delete("/{book_id}")
async def delete_book(book_id: str):
    """Delete a book and all its pages"""
    db = get_db()
    
    # Delete pages first
    await db.pages.delete_many({"bookId": book_id})
    
    # Delete book
    result = await db.books.delete_one({"id": book_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return {"message": "Kitap başarıyla silindi"}


@router.delete("/{book_id}/pages/{page_id}")
async def delete_page(book_id: str, page_id: str):
    """Delete a page and reorder remaining pages"""
    db = get_db()
    
    # Get the page to find its number before deleting
    page = await db.pages.find_one({"id": page_id, "bookId": book_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    deleted_page_num = page.get("pageNumber", 0)
    
    # Delete the page
    await db.pages.delete_one({"id": page_id, "bookId": book_id})
    
    # Shift remaining pages down to fill the gap
    await db.pages.update_many(
        {"bookId": book_id, "pageNumber": {"$gt": deleted_page_num}},
        {"$inc": {"pageNumber": -1}}
    )
    
    # Update book's total pages
    total_pages = await db.pages.count_documents({"bookId": book_id})
    await db.books.update_one({"id": book_id}, {"$set": {"totalPages": total_pages}})
    
    return {"message": "Sayfa başarıyla silindi"}
