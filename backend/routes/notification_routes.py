"""
Notification Routes for Çocuk Kitapları
Handles in-app notifications for users
"""
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import os
import uuid

router = APIRouter(prefix="/notifications", tags=["notifications"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


# Models
class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str  # 'new_book', 'new_category', 'subscription', 'achievement', 'announcement', 'reminder'
    target_audience: str = "all"  # 'all', 'free', 'premium'
    link: Optional[str] = None  # Optional deep link (e.g., book ID)
    icon: Optional[str] = None  # Icon type for frontend
    expires_at: Optional[str] = None  # Optional expiration


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    icon: Optional[str] = None
    link: Optional[str] = None
    read: bool = False
    created_at: str


class MarkReadRequest(BaseModel):
    notification_ids: List[str]


# Helper to get user from session
async def get_user_from_request(request: Request):
    """Get current user from session token"""
    db = get_db()
    
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        return None
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    return user


# Icon mapping for notification types
NOTIFICATION_ICONS = {
    "new_book": "book",
    "new_category": "folder",
    "subscription": "crown",
    "achievement": "star",
    "announcement": "megaphone",
    "reminder": "bell",
    "trial": "gift"
}


@router.get("/")
async def get_user_notifications(request: Request, limit: int = 20, unread_only: bool = False):
    """Get notifications for the current user"""
    db = get_db()
    
    user = await get_user_from_request(request)
    user_id = user["user_id"] if user else "guest"
    user_tier = user.get("subscription_tier", "free") if user else "free"
    
    # Build query for notifications
    # Get notifications that target: 'all', or user's specific tier, or are user-specific
    query = {
        "$or": [
            {"target_audience": "all"},
            {"target_audience": user_tier},
            {"target_user_id": user_id}
        ]
    }
    
    # Filter expired notifications
    query["$and"] = [
        {
            "$or": [
                {"expires_at": None},
                {"expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}}
            ]
        }
    ]
    
    # Check read status
    user_reads = await db.notification_reads.find(
        {"user_id": user_id},
        {"notification_id": 1}
    ).to_list(length=1000)
    read_ids = {r["notification_id"] for r in user_reads}
    
    if unread_only:
        query["id"] = {"$nin": list(read_ids)}
    
    # Fetch notifications
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    # Add read status to each notification
    result = []
    for notif in notifications:
        notif["read"] = notif.get("id", "") in read_ids
        result.append(notif)
    
    # Count unread
    unread_count = sum(1 for n in result if not n["read"])
    
    return {
        "notifications": result,
        "unread_count": unread_count,
        "total": len(result)
    }


@router.get("/unread-count")
async def get_unread_count(request: Request):
    """Get count of unread notifications for badge display"""
    db = get_db()
    
    user = await get_user_from_request(request)
    user_id = user["user_id"] if user else "guest"
    user_tier = user.get("subscription_tier", "free") if user else "free"
    
    # Get read notification IDs
    user_reads = await db.notification_reads.find(
        {"user_id": user_id},
        {"notification_id": 1}
    ).to_list(length=1000)
    read_ids = [r["notification_id"] for r in user_reads]
    
    # Count unread notifications targeting this user
    count = await db.notifications.count_documents({
        "$or": [
            {"target_audience": "all"},
            {"target_audience": user_tier},
            {"target_user_id": user_id}
        ],
        "id": {"$nin": read_ids},
        "$or": [
            {"expires_at": None},
            {"expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}}
        ]
    })
    
    return {"unread_count": count}


@router.post("/mark-read")
async def mark_notifications_read(mark_request: MarkReadRequest, request: Request):
    """Mark notifications as read"""
    db = get_db()
    
    user = await get_user_from_request(request)
    user_id = user["user_id"] if user else "guest"
    
    # Insert read records
    for notif_id in mark_request.notification_ids:
        await db.notification_reads.update_one(
            {"user_id": user_id, "notification_id": notif_id},
            {
                "$set": {
                    "user_id": user_id,
                    "notification_id": notif_id,
                    "read_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
    
    return {"success": True, "marked_count": len(mark_request.notification_ids)}


@router.post("/mark-all-read")
async def mark_all_notifications_read(request: Request):
    """Mark all notifications as read for current user"""
    db = get_db()
    
    user = await get_user_from_request(request)
    user_id = user["user_id"] if user else "guest"
    user_tier = user.get("subscription_tier", "free") if user else "free"
    
    # Get all notification IDs for this user
    notifications = await db.notifications.find(
        {
            "$or": [
                {"target_audience": "all"},
                {"target_audience": user_tier},
                {"target_user_id": user_id}
            ]
        },
        {"id": 1}
    ).to_list(length=1000)
    
    # Mark all as read
    for notif in notifications:
        await db.notification_reads.update_one(
            {"user_id": user_id, "notification_id": notif["id"]},
            {
                "$set": {
                    "user_id": user_id,
                    "notification_id": notif["id"],
                    "read_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
    
    return {"success": True, "marked_count": len(notifications)}


# ============ ADMIN ENDPOINTS ============

@router.post("/admin/create")
async def create_notification(notification: NotificationCreate, request: Request):
    """Admin: Create a new notification"""
    db = get_db()
    
    # Verify admin (optional - can add admin check here)
    user = await get_user_from_request(request)
    if not user or user.get("email") != "coskanselcuk@gmail.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    notif_doc = {
        "id": notif_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "target_audience": notification.target_audience,
        "link": notification.link,
        "icon": notification.icon or NOTIFICATION_ICONS.get(notification.type, "bell"),
        "expires_at": notification.expires_at,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"] if user else "system"
    }
    
    await db.notifications.insert_one(notif_doc)
    
    return {"success": True, "notification_id": notif_id}


@router.get("/admin/list")
async def list_all_notifications(request: Request, limit: int = 50):
    """Admin: List all notifications"""
    db = get_db()
    
    # Verify admin
    user = await get_user_from_request(request)
    if not user or user.get("email") != "coskanselcuk@gmail.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    notifications = await db.notifications.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"notifications": notifications, "total": len(notifications)}


@router.delete("/admin/{notification_id}")
async def delete_notification(notification_id: str, request: Request):
    """Admin: Delete a notification"""
    db = get_db()
    
    # Verify admin
    user = await get_user_from_request(request)
    if not user or user.get("email") != "coskanselcuk@gmail.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.notifications.delete_one({"id": notification_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Also delete read records
    await db.notification_reads.delete_many({"notification_id": notification_id})
    
    return {"success": True}


# ============ AUTO-NOTIFICATION HELPERS ============

async def create_system_notification(
    title: str,
    message: str,
    notif_type: str,
    target_audience: str = "all",
    link: Optional[str] = None,
    target_user_id: Optional[str] = None
):
    """Helper function to create system-generated notifications"""
    db = get_db()
    
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    notif_doc = {
        "id": notif_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "target_audience": target_audience,
        "target_user_id": target_user_id,
        "link": link,
        "icon": NOTIFICATION_ICONS.get(notif_type, "bell"),
        "expires_at": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "system"
    }
    
    await db.notifications.insert_one(notif_doc)
    return notif_id


# Function to be called when a new book is added
async def notify_new_book(book_title: str, book_id: str, is_premium: bool = False):
    """Create notification for new book"""
    target = "premium" if is_premium else "all"
    await create_system_notification(
        title="Yeni Kitap! 📚",
        message=f"'{book_title}' kitabı eklendi. Hemen okumaya başla!",
        notif_type="new_book",
        target_audience=target,
        link=book_id
    )


# Function to be called when a new category is added
async def notify_new_category(category_name: str, category_slug: str):
    """Create notification for new category"""
    await create_system_notification(
        title="Yeni Kategori! 🎨",
        message=f"'{category_name}' kategorisi eklendi. Keşfetmeye başla!",
        notif_type="new_category",
        target_audience="all",
        link=category_slug
    )


# Function to notify user about trial expiring
async def notify_trial_expiring(user_id: str, days_remaining: int):
    """Create notification for trial expiring soon"""
    await create_system_notification(
        title="Deneme Süreniz Bitiyor! ⏰",
        message=f"Premium denemeniz {days_remaining} gün içinde sona erecek. Abone olarak erişiminizi sürdürün!",
        notif_type="trial",
        target_audience="all",
        target_user_id=user_id
    )


# Function to notify reading achievement
async def notify_achievement(user_id: str, achievement_title: str, achievement_message: str):
    """Create notification for reading achievement"""
    await create_system_notification(
        title=f"Başarı Kazandın! 🏆 {achievement_title}",
        message=achievement_message,
        notif_type="achievement",
        target_audience="all",
        target_user_id=user_id
    )
