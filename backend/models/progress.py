from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


def generate_id():
    return str(uuid.uuid4())


def now_utc():
    return datetime.now(timezone.utc)


class ReadingProgressBase(BaseModel):
    userId: str
    bookId: str
    currentPage: int = 0


class ReadingProgressCreate(ReadingProgressBase):
    pass


class ReadingProgress(ReadingProgressBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=generate_id)
    isCompleted: bool = False
    completedAt: Optional[datetime] = None
    lastReadAt: datetime = Field(default_factory=now_utc)
    totalReadTime: int = 0  # seconds


class ProgressUpdateRequest(BaseModel):
    userId: str
    bookId: str
    currentPage: int


class ProgressCompleteRequest(BaseModel):
    userId: str
    bookId: str


class BookProgressResponse(BaseModel):
    bookId: str
    bookTitle: str
    currentPage: int
    totalPages: int
    isCompleted: bool
    lastReadAt: str


class UserProgressResponse(BaseModel):
    userId: str
    books: List[BookProgressResponse]


class ProgressSaveResponse(BaseModel):
    success: bool
    progress: dict


class ProgressCompleteResponse(BaseModel):
    success: bool
    message: str
