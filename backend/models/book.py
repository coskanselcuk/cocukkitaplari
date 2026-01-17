from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


def generate_id():
    return str(uuid.uuid4())


def now_utc():
    return datetime.now(timezone.utc)


class Hotspot(BaseModel):
    x: float = Field(..., description="X position as percentage")
    y: float = Field(..., description="Y position as percentage")
    size: float = Field(default=12, description="Size of hotspot")
    action: Optional[str] = Field(default=None, description="Action to perform")


class BookBase(BaseModel):
    title: str
    author: str
    category: str
    coverImage: str
    description: str
    ageGroup: str
    duration: str
    hasAudio: bool = True
    isNew: bool = False
    rating: float = 0.0
    readCount: int = 0
    totalPages: int = 0


class BookCreate(BookBase):
    pass


class Book(BookBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=generate_id)
    createdAt: datetime = Field(default_factory=now_utc)
    updatedAt: datetime = Field(default_factory=now_utc)


class BookResponse(BaseModel):
    id: str
    title: str
    author: str
    category: str
    coverImage: str
    description: str
    ageGroup: str
    duration: str
    hasAudio: bool
    isNew: bool
    rating: float
    readCount: int
    totalPages: int


class BooksListResponse(BaseModel):
    books: List[BookResponse]
    total: int
    limit: int
    offset: int


class PageBase(BaseModel):
    pageNumber: int
    text: str
    image: str
    hotspots: List[Hotspot] = Field(default_factory=list)


class PageCreate(PageBase):
    bookId: Optional[str] = None  # Optional since it comes from URL path


class Page(PageBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=generate_id)
    bookId: str
    audioUrl: Optional[str] = None


class PageResponse(BaseModel):
    pageNumber: int
    text: str
    image: str
    hotspots: List[Hotspot]
    audioUrl: Optional[str] = None


class BookPagesResponse(BaseModel):
    bookId: str
    pages: List[PageResponse]
