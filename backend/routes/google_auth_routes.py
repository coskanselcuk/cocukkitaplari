"""
Google Sign-In Authentication Routes for Çocuk Kitapları
Handles direct Google OAuth for iOS native and web
"""
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
import uuid
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/auth/google", tags=["google-auth"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_IOS_CLIENT_ID = os.environ.get('GOOGLE_IOS_CLIENT_ID')
GOOGLE_ANDROID_CLIENT_ID = os.environ.get('GOOGLE_ANDROID_CLIENT_ID')

# All valid client IDs for token verification
VALID_CLIENT_IDS = [GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID]


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


class GoogleTokenRequest(BaseModel):
    idToken: str
    accessToken: Optional[str] = None
    serverAuthCode: Optional[str] = None


class GoogleUserInfo(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    google_id: str


async def verify_google_id_token(token: str) -> dict:
    """Verify Google ID token and extract user info"""
    try:
        # Try verification with each valid client ID
        for client_id in VALID_CLIENT_IDS:
            if not client_id:
                continue
            try:
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request(), 
                    client_id
                )
                
                # Verify the issuer
                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    continue
                    
                return idinfo
            except ValueError:
                continue
        
        raise HTTPException(status_code=401, detail="Invalid Google token")
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


@router.post("/verify")
async def verify_google_token(request: GoogleTokenRequest, response: Response):
    """Verify Google ID token and create/update user session"""
    db = get_db()
    
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google credentials not configured")
    
    # Verify the ID token
    idinfo = await verify_google_id_token(request.idToken)
    
    # Extract user information
    google_user_id = idinfo.get('sub')
    email = idinfo.get('email')
    name = idinfo.get('name', 'Google User')
    picture = idinfo.get('picture', '')
    
    if not google_user_id or not email:
        raise HTTPException(status_code=400, detail="Unable to extract user info from token")
    
    # Check if user exists by Google ID
    existing_user = await db.users.find_one({"google_id": google_user_id}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": name,
                "picture": picture,
                "email": email
            }}
        )
    else:
        # Check if user exists by email (might have signed up with Apple before)
        existing_email_user = await db.users.find_one({"email": email}, {"_id": 0})
        if existing_email_user:
            # Link Google ID to existing account
            user_id = existing_email_user["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "google_id": google_user_id,
                    "name": name,
                    "picture": picture,
                    "auth_providers": list(set(existing_email_user.get("auth_providers", ["apple"]) + ["google"]))
                }}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "google_id": google_user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "subscription_tier": "free",
                "auth_providers": ["google"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    # Generate session token
    session_token = f"google_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Clear old sessions and create new one
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "auth_provider": "google",
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Get updated user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )
    
    return {
        "success": True,
        "user": {
            "user_id": user["user_id"],
            "email": user.get("email", ""),
            "name": user.get("name", "Google User"),
            "picture": user.get("picture", ""),
            "subscription_tier": user.get("subscription_tier", "free"),
            "created_at": user.get("created_at", ""),
            "auth_provider": "google"
        },
        "session_token": session_token
    }


@router.get("/config")
async def get_google_config():
    """Get Google Sign-In configuration for frontend"""
    return {
        "webClientId": GOOGLE_CLIENT_ID,
        "iosClientId": GOOGLE_IOS_CLIENT_ID,
        "androidClientId": GOOGLE_ANDROID_CLIENT_ID,
        "scopes": ["email", "profile"]
    }
