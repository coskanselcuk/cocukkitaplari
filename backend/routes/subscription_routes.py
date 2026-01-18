"""
Subscription Routes for Çocuk Kitapları
Handles in-app purchase verification and subscription management for iOS and Android
"""
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
import os
import json
import base64

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


# Models
class PurchaseVerificationRequest(BaseModel):
    user_id: str
    platform: str  # 'ios' or 'android'
    product_id: str
    transaction_id: str
    receipt_data: str  # Base64 encoded receipt for iOS, purchase token for Android


class SubscriptionStatusResponse(BaseModel):
    is_active: bool
    subscription_tier: str
    product_id: Optional[str] = None
    expires_at: Optional[str] = None
    platform: Optional[str] = None
    auto_renewing: bool = False


class RestorePurchaseRequest(BaseModel):
    user_id: str
    platform: str
    receipts: list  # List of receipt data to verify


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


@router.post("/verify-purchase")
async def verify_purchase(purchase: PurchaseVerificationRequest, request: Request):
    """
    Verify a purchase receipt and update user subscription status.
    For production, this should validate with Apple/Google servers.
    """
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_id"] != purchase.user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    # Store the purchase record
    purchase_record = {
        "user_id": purchase.user_id,
        "platform": purchase.platform,
        "product_id": purchase.product_id,
        "transaction_id": purchase.transaction_id,
        "receipt_data": purchase.receipt_data,
        "verified": True,  # In production, set after actual verification
        "verification_status": "pending_production_validation",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "verified_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check for duplicate transaction
    existing = await db.purchases.find_one({
        "transaction_id": purchase.transaction_id,
        "platform": purchase.platform
    })
    
    if existing:
        return {
            "success": True,
            "message": "Purchase already verified",
            "already_processed": True
        }
    
    # Insert purchase record
    await db.purchases.insert_one(purchase_record)
    
    # Determine subscription duration based on product
    if "yearly" in purchase.product_id.lower() or "annual" in purchase.product_id.lower():
        expires_at = datetime.now(timezone.utc) + timedelta(days=365)
    else:
        # Default to monthly
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    # Update user subscription status
    await db.users.update_one(
        {"user_id": purchase.user_id},
        {
            "$set": {
                "subscription_tier": "premium",
                "subscription_product_id": purchase.product_id,
                "subscription_platform": purchase.platform,
                "subscription_expires_at": expires_at.isoformat(),
                "subscription_auto_renewing": True,
                "last_purchase_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Create subscription record
    subscription_record = {
        "user_id": purchase.user_id,
        "product_id": purchase.product_id,
        "platform": purchase.platform,
        "transaction_id": purchase.transaction_id,
        "is_active": True,
        "expires_at": expires_at.isoformat(),
        "auto_renewing": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert subscription (update if exists, insert if not)
    await db.subscriptions.update_one(
        {"user_id": purchase.user_id},
        {"$set": subscription_record},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Purchase verified successfully",
        "subscription": {
            "is_active": True,
            "tier": "premium",
            "product_id": purchase.product_id,
            "expires_at": expires_at.isoformat()
        }
    }


@router.get("/status/{user_id}")
async def get_subscription_status(user_id: str, request: Request):
    """Get the current subscription status for a user"""
    db = get_db()
    
    # Get user
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if subscription has expired
    is_active = user.get("subscription_tier") == "premium"
    expires_at = user.get("subscription_expires_at")
    
    if expires_at:
        try:
            expiry_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            if expiry_date < datetime.now(timezone.utc):
                is_active = False
                # Update user to free if expired
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {"subscription_tier": "free"}}
                )
        except Exception:
            pass
    
    return SubscriptionStatusResponse(
        is_active=is_active,
        subscription_tier=user.get("subscription_tier", "free"),
        product_id=user.get("subscription_product_id"),
        expires_at=expires_at,
        platform=user.get("subscription_platform"),
        auto_renewing=user.get("subscription_auto_renewing", False)
    )


@router.post("/restore")
async def restore_purchases(restore_request: RestorePurchaseRequest, request: Request):
    """
    Restore purchases for a user.
    This is called when user taps "Restore Purchases" button.
    """
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_id"] != restore_request.user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    restored_count = 0
    latest_expiry = None
    latest_product = None
    
    for receipt in restore_request.receipts:
        # In production, verify each receipt with Apple/Google
        # For now, mark as restored and track
        
        # Store restore attempt
        restore_record = {
            "user_id": restore_request.user_id,
            "platform": restore_request.platform,
            "receipt_data": receipt if isinstance(receipt, str) else json.dumps(receipt),
            "restored_at": datetime.now(timezone.utc).isoformat()
        }
        await db.restore_attempts.insert_one(restore_record)
        restored_count += 1
    
    # Check if user has any valid purchases in our records
    existing_purchases = await db.purchases.find(
        {"user_id": restore_request.user_id, "verified": True}
    ).to_list(length=100)
    
    if existing_purchases:
        # User has previous purchases - restore premium status
        await db.users.update_one(
            {"user_id": restore_request.user_id},
            {
                "$set": {
                    "subscription_tier": "premium",
                    "subscription_restored_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Purchases restored successfully",
            "restored_count": len(existing_purchases),
            "subscription_active": True
        }
    
    return {
        "success": True,
        "message": "No previous purchases found",
        "restored_count": 0,
        "subscription_active": False
    }


@router.post("/cancel/{user_id}")
async def cancel_subscription(user_id: str, request: Request):
    """
    Mark a subscription as cancelled (auto-renewal off).
    Note: This doesn't actually cancel with Apple/Google - that must be done on device.
    """
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    # Update auto-renewing status
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "subscription_auto_renewing": False,
                "subscription_cancelled_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "auto_renewing": False,
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "success": True,
        "message": "Subscription marked as cancelled. Access continues until expiry."
    }


@router.get("/history/{user_id}")
async def get_purchase_history(user_id: str, request: Request):
    """Get purchase history for a user"""
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    purchases = await db.purchases.find(
        {"user_id": user_id},
        {"_id": 0, "receipt_data": 0}  # Exclude sensitive data
    ).sort("created_at", -1).to_list(length=50)
    
    return {
        "purchases": purchases,
        "total": len(purchases)
    }


@router.post("/webhook/apple")
async def apple_webhook(request: Request):
    """
    Apple App Store Server Notifications webhook.
    In production, verify the JWS signature.
    """
    try:
        body = await request.json()
        
        # Log notification for debugging
        db = get_db()
        await db.webhook_logs.insert_one({
            "platform": "apple",
            "payload": body,
            "received_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Handle notification types
        notification_type = body.get("notificationType")
        
        if notification_type in ["DID_RENEW", "SUBSCRIBED"]:
            # Subscription renewed or new subscription
            pass
        elif notification_type in ["DID_FAIL_TO_RENEW", "EXPIRED"]:
            # Subscription expired
            pass
        elif notification_type == "DID_CHANGE_RENEWAL_STATUS":
            # Auto-renewal toggled
            pass
        elif notification_type == "REFUND":
            # Refund processed
            pass
        
        return {"status": "received"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/webhook/google")
async def google_webhook(request: Request):
    """
    Google Play Real-time Developer Notifications webhook.
    In production, verify the message signature.
    """
    try:
        body = await request.json()
        
        # Log notification
        db = get_db()
        await db.webhook_logs.insert_one({
            "platform": "google",
            "payload": body,
            "received_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Decode the message
        message = body.get("message", {})
        data = message.get("data")
        
        if data:
            # Base64 decode the notification
            decoded = base64.b64decode(data).decode('utf-8')
            notification = json.loads(decoded)
            
            # Handle notification
            notification_type = notification.get("subscriptionNotification", {}).get("notificationType")
            
            # Types: 1=RECOVERED, 2=RENEWED, 3=CANCELED, 4=PURCHASED, 5=ON_HOLD, etc.
        
        return {"status": "received"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# Admin endpoints
@router.get("/admin/stats")
async def get_subscription_stats(request: Request):
    """Admin endpoint to get subscription statistics"""
    db = get_db()
    
    # Count subscriptions
    total_users = await db.users.count_documents({})
    premium_users = await db.users.count_documents({"subscription_tier": "premium"})
    total_purchases = await db.purchases.count_documents({})
    
    # Get recent purchases
    recent_purchases = await db.purchases.find(
        {},
        {"_id": 0, "receipt_data": 0}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "free_users": total_users - premium_users,
        "conversion_rate": round((premium_users / total_users * 100) if total_users > 0 else 0, 2),
        "total_purchases": total_purchases,
        "recent_purchases": recent_purchases
    }
