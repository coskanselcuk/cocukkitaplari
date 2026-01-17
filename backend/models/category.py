from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid


def generate_id():
    return str(uuid.uuid4())


class CategoryBase(BaseModel):
    slug: str
    name: str
    description: str
    icon: str
    color: str
    gradient: str
    islandImage: str
    sortOrder: int = 0


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=generate_id)


class CategoryResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    icon: str
    color: str
    gradient: str
    islandImage: str


class CategoriesListResponse(BaseModel):
    categories: List[CategoryResponse]
