from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid


def generate_id():
    return str(uuid.uuid4())


class CategoryBase(BaseModel):
    slug: str
    name: str
    description: str = ""
    icon: str = "📚"
    iconImage: str = ""  # Image URL for category icon (takes priority over emoji)
    color: str = "#FF6B35"
    gradient: str = "from-orange-400 to-orange-600"
    islandImage: str = ""
    ageGroup: str = "4-6"
    sortOrder: int = 0


class CategoryCreate(BaseModel):
    slug: str
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "📚"
    iconImage: Optional[str] = ""
    color: Optional[str] = "#FF6B35"
    gradient: Optional[str] = "from-orange-400 to-orange-600"
    islandImage: Optional[str] = ""
    ageGroup: Optional[str] = "4-6"
    sortOrder: Optional[int] = 0


class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=generate_id)


class CategoryResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: str = ""
    icon: str = "📚"
    iconImage: str = ""
    color: str = "#FF6B35"
    gradient: str = "from-orange-400 to-orange-600"
    islandImage: str = ""
    ageGroup: str = "4-6"
    sortOrder: int = 0


class CategoriesListResponse(BaseModel):
    categories: List[CategoryResponse]
