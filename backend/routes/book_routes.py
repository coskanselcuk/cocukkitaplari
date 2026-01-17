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


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    coverImage: Optional[str] = None
    description: Optional[str] = None
    ageGroup: Optional[str] = None
    duration: Optional[str] = None


class PageUpdate(BaseModel):
    text: Optional[str] = None
    image: Optional[str] = None
    pageNumber: Optional[int] = None

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
    
    return BookResponse(**doc)


@router.post("/{book_id}/pages", response_model=PageResponse)
async def create_page(book_id: str, page_data: PageCreate):
    """Create a new page for a book (admin endpoint)"""
    db = get_db()
    
    # Verify book exists
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    page = Page(bookId=book_id, **page_data.model_dump(exclude={"bookId"}))
    doc = page.model_dump()
    
    await db.pages.insert_one(doc)
    
    # Update book's total pages
    total_pages = await db.pages.count_documents({"bookId": book_id})
    await db.books.update_one({"id": book_id}, {"$set": {"totalPages": total_pages}})
    
    return PageResponse(**doc)
