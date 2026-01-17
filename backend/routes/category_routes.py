from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os

from models.category import (
    Category, CategoryCreate, CategoryResponse, CategoriesListResponse
)

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
    
    return CategoryResponse(**doc)
