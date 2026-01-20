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
    is_trial: bool = False
    trial_ends_at: Optional[str] = None
    trial_used: bool = False


class RestorePurchaseRequest(BaseModel):
    user_id: str
    platform: str
    receipts: list  # List of receipt data to verify


class StartTrialRequest(BaseModel):
    user_id: str


# Trial duration in days
TRIAL_DURATION_DAYS = 7


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
    
    # Check trial status
    is_trial = user.get("is_trial", False)
    trial_ends_at = user.get("trial_ends_at")
    trial_used = user.get("trial_used", False)
    
    # Check if trial has expired
    if is_trial and trial_ends_at:
        try:
            trial_end_date = datetime.fromisoformat(trial_ends_at.replace('Z', '+00:00'))
            if trial_end_date < datetime.now(timezone.utc):
                is_trial = False
                # Update user - trial expired
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "is_trial": False,
                        "subscription_tier": "free"
                    }}
                )
        except Exception:
            pass
    
    # Check if subscription has expired
    is_active = user.get("subscription_tier") == "premium" or is_trial
    expires_at = user.get("subscription_expires_at")
    
    if expires_at and not is_trial:
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
        expires_at=trial_ends_at if is_trial else expires_at,
        platform=user.get("subscription_platform"),
        auto_renewing=user.get("subscription_auto_renewing", False),
        is_trial=is_trial,
        trial_ends_at=trial_ends_at,
        trial_used=trial_used
    )


@router.post("/start-trial")
async def start_free_trial(trial_request: StartTrialRequest, request: Request):
    """
    Start a 7-day free trial for a user.
    Each user can only use the trial once.
    """
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user["user_id"] != trial_request.user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    # Check if user has already used trial
    if user.get("trial_used", False):
        raise HTTPException(
            status_code=400, 
            detail="Ücretsiz deneme hakkınızı daha önce kullandınız"
        )
    
    # Check if user already has active subscription
    if user.get("subscription_tier") == "premium" and not user.get("is_trial"):
        raise HTTPException(
            status_code=400,
            detail="Zaten aktif bir aboneliğiniz var"
        )
    
    # Calculate trial end date
    trial_ends_at = datetime.now(timezone.utc) + timedelta(days=TRIAL_DURATION_DAYS)
    
    # Update user with trial status
    await db.users.update_one(
        {"user_id": trial_request.user_id},
        {
            "$set": {
                "subscription_tier": "premium",
                "is_trial": True,
                "trial_used": True,
                "trial_started_at": datetime.now(timezone.utc).isoformat(),
                "trial_ends_at": trial_ends_at.isoformat()
            }
        }
    )
    
    # Log trial start
    await db.trial_logs.insert_one({
        "user_id": trial_request.user_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ends_at": trial_ends_at.isoformat(),
        "duration_days": TRIAL_DURATION_DAYS
    })
    
    return {
        "success": True,
        "message": f"{TRIAL_DURATION_DAYS} günlük ücretsiz denemeniz başladı!",
        "trial": {
            "is_active": True,
            "ends_at": trial_ends_at.isoformat(),
            "days_remaining": TRIAL_DURATION_DAYS
        }
    }


@router.get("/trial-status/{user_id}")
async def get_trial_status(user_id: str, request: Request):
    """Get trial status for a user"""
    db = get_db()
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_trial = user.get("is_trial", False)
    trial_ends_at = user.get("trial_ends_at")
    trial_used = user.get("trial_used", False)
    
    days_remaining = 0
    if is_trial and trial_ends_at:
        try:
            trial_end_date = datetime.fromisoformat(trial_ends_at.replace('Z', '+00:00'))
            if trial_end_date > datetime.now(timezone.utc):
                days_remaining = (trial_end_date - datetime.now(timezone.utc)).days
            else:
                is_trial = False
        except Exception:
            pass
    
    return {
        "is_trial": is_trial,
        "trial_used": trial_used,
        "trial_ends_at": trial_ends_at,
        "days_remaining": days_remaining,
        "can_start_trial": not trial_used and user.get("subscription_tier") != "premium"
    }


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


@router.get("/admin/trial-notifications")
async def get_trial_notification_status(request: Request):
    """Admin endpoint to see trial notification history"""
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user or user.get("email") != "coskanselcuk@gmail.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all sent trial notifications
    sent_notifications = await db.sent_trial_notifications.find(
        {},
        {"_id": 0}
    ).sort("sent_at", -1).to_list(length=100)
    
    # Get users with active trials
    active_trials = await db.users.find(
        {"is_trial": True},
        {"_id": 0, "user_id": 1, "email": 1, "name": 1, "trial_ends_at": 1}
    ).to_list(length=100)
    
    # Calculate days remaining for each
    now = datetime.now(timezone.utc)
    for trial in active_trials:
        try:
            trial_ends_at = datetime.fromisoformat(trial.get("trial_ends_at", "").replace('Z', '+00:00'))
            trial["days_remaining"] = max(0, (trial_ends_at - now).days)
        except Exception:
            trial["days_remaining"] = "unknown"
    
    return {
        "sent_notifications": sent_notifications,
        "active_trials": active_trials,
        "total_sent": len(sent_notifications),
        "total_active_trials": len(active_trials)
    }


@router.post("/admin/trigger-trial-check")
async def trigger_trial_check(request: Request):
    """Admin endpoint to manually trigger trial expiration check"""
    from routes.notification_routes import create_system_notification
    
    db = get_db()
    
    # Get authenticated user
    user = await get_user_from_request(request)
    if not user or user.get("email") != "coskanselcuk@gmail.com":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    notifications_sent = []
    
    # Find users with active trials
    trial_users = await db.users.find({
        "is_trial": True,
        "trial_ends_at": {"$exists": True}
    }, {"_id": 0}).to_list(length=1000)
    
    for trial_user in trial_users:
        user_id = trial_user.get("user_id")
        trial_ends_at_str = trial_user.get("trial_ends_at")
        
        if not trial_ends_at_str:
            continue
        
        try:
            trial_ends_at = datetime.fromisoformat(trial_ends_at_str.replace('Z', '+00:00'))
        except Exception:
            continue
        
        days_remaining = (trial_ends_at - now).days
        
        # Check if notification already sent for this milestone
        existing_notif = await db.sent_trial_notifications.find_one({
            "user_id": user_id,
            "days_remaining": days_remaining
        })
        
        if existing_notif:
            continue
        
        # Send notification based on days remaining
        if days_remaining in [3, 1, 0]:
            if days_remaining == 3:
                title = "Deneme Süreniz Bitiyor! ⏰"
                message = "Premium denemeniz 3 gün içinde sona erecek. Abone olarak tüm kitaplara erişiminizi sürdürün!"
            elif days_remaining == 1:
                title = "Son 1 Gün! ⚠️"
                message = "Premium denemeniz yarın sona eriyor! Hemen abone olun ve kesintisiz okumaya devam edin."
            else:
                title = "Deneme Süreniz Bitti 😔"
                message = "Premium denemeniz sona erdi. Premium kitaplara erişmek için abone olun!"
            
            await create_system_notification(
                title=title,
                message=message,
                notif_type="trial",
                target_user_id=user_id
            )
            
            await db.sent_trial_notifications.insert_one({
                "user_id": user_id,
                "days_remaining": days_remaining,
                "sent_at": now.isoformat(),
                "triggered_manually": True
            })
            
            notifications_sent.append({
                "user_id": user_id,
                "days_remaining": days_remaining
            })
    
    return {
        "success": True,
        "message": f"Manual trial check complete. {len(notifications_sent)} notifications sent.",
        "notifications_sent": notifications_sent,
        "users_checked": len(trial_users)
    }
