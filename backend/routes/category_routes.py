from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
import os

from models.category import (
    Category, CategoryCreate, CategoryResponse, CategoriesListResponse
)
from routes.notification_routes import notify_new_category


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    iconImage: Optional[str] = None
    ageGroup: Optional[str] = None
    sortOrder: Optional[int] = None


router = APIRouter(prefix="/categories", tags=["categories"])

# Get database from environment
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


@router.get("", response_model=CategoriesListResponse)
async def get_categories():
    """Get all categories sorted by sortOrder"""
    db = get_db()
    
    cursor = db.categories.find({}, {"_id": 0}).sort("sortOrder", 1)
    categories = await cursor.to_list(length=100)
    
    return CategoriesListResponse(
        categories=[CategoryResponse(**cat) for cat in categories]
    )


@router.get("/{category_slug}", response_model=CategoryResponse)
async def get_category(category_slug: str):
    """Get a single category by slug"""
    db = get_db()
    
    category = await db.categories.find_one({"slug": category_slug}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return CategoryResponse(**category)


@router.post("", response_model=CategoryResponse)
async def create_category(category_data: CategoryCreate):
    """Create a new category (admin endpoint)"""
    db = get_db()
    
    # Check if slug already exists
    existing = await db.categories.find_one({"slug": category_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists")
    
    category = Category(**category_data.model_dump())
    doc = category.model_dump()
    
    await db.categories.insert_one(doc)
    
    # Create notification for new category
    try:
        await notify_new_category(
            category_name=doc.get('name', 'Yeni Kategori'),
            category_slug=doc.get('slug')
        )
    except Exception as e:
        print(f"Failed to create notification: {e}")
    
    return CategoryResponse(**doc)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category_data: CategoryUpdate):
    """Update a category"""
    db = get_db()
    
    # Check if category exists
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Build update dict - include empty strings but exclude None values
    # This allows clearing fields by setting them to empty string
    update_data = {}
    for k, v in category_data.model_dump().items():
        if v is not None:  # Only exclude None, allow empty strings
            update_data[k] = v
    
    if update_data:
        await db.categories.update_one({"id": category_id}, {"$set": update_data})
    
    # Return updated category
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return CategoryResponse(**updated)


@router.delete("/{category_id}")
async def delete_category(category_id: str):
    """Delete a category"""
    db = get_db()
    
    result = await db.categories.delete_one({"id": category_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Kategori başarıyla silindi"}
