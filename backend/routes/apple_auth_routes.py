"""
Apple Sign-In Authentication Routes for Çocuk Kitapları
Handles Apple ID authentication for iOS native and web fallback
"""
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
import uuid
import os
import json
from jose import jwt, JWTError
from jose.backends.rsa_backend import RSAKey

router = APIRouter(prefix="/auth/apple", tags=["apple-auth"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

# Apple configuration
APPLE_TEAM_ID = os.environ.get('APPLE_TEAM_ID')
APPLE_CLIENT_ID = os.environ.get('APPLE_CLIENT_ID')
APPLE_KEY_ID = os.environ.get('APPLE_KEY_ID')
APPLE_PRIVATE_KEY = os.environ.get('APPLE_PRIVATE_KEY', '').replace('\\n', '\n')
APPLE_PUBLIC_KEYS_URL = "https://appleid.apple.com/auth/keys"


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


class AppleVerifyRequest(BaseModel):
    identityToken: str
    userIdentifier: Optional[str] = None
    email: Optional[str] = None
    fullName: Optional[dict] = None
    authorizationCode: Optional[str] = None


class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    subscription_tier: str = "free"
    created_at: str
    auth_provider: str = "apple"


async def get_apple_public_keys():
    """Fetch Apple's public keys for token verification"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(APPLE_PUBLIC_KEYS_URL)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch Apple public keys: {str(e)}"
        )


def verify_apple_identity_token(token: str, public_keys: dict) -> dict:
    """Verify Apple identity token using Apple's public key"""
    try:
        # Decode header without verification to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(status_code=401, detail="Token missing kid header")
        
        # Find the matching public key
        public_key_data = None
        for key in public_keys.get("keys", []):
            if key.get("kid") == kid:
                public_key_data = key
                break
        
        if not public_key_data:
            raise HTTPException(status_code=401, detail="Unable to find matching public key")
        
        # Decode and verify token
        # Apple tokens use RS256 algorithm
        decoded_token = jwt.decode(
            token,
            public_key_data,
            algorithms=["RS256"],
            audience=APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com"
        )
        
        return decoded_token
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


@router.post("/verify")
async def verify_apple_token(request: AppleVerifyRequest, response: Response):
    """Verify Apple identity token and create/update user session"""
    db = get_db()
    
    if not APPLE_CLIENT_ID or not APPLE_TEAM_ID:
        raise HTTPException(status_code=500, detail="Apple credentials not configured")
    
    # Get Apple public keys
    public_keys = await get_apple_public_keys()
    
    # Verify the identity token
    decoded_token = verify_apple_identity_token(request.identityToken, public_keys)
    
    # Extract user information from token
    apple_user_id = decoded_token.get("sub")
    token_email = decoded_token.get("email")
    
    # Apple only provides email on first sign-in, use request email as fallback
    email = token_email or request.email
    
    if not apple_user_id:
        raise HTTPException(status_code=400, detail="Unable to extract user ID from token")
    
    # Build user name from fullName if provided (only on first sign-in)
    user_name = "Apple Kullanıcı"
    if request.fullName:
        name_parts = []
        if request.fullName.get("givenName"):
            name_parts.append(request.fullName["givenName"])
        if request.fullName.get("familyName"):
            name_parts.append(request.fullName["familyName"])
        if name_parts:
            user_name = " ".join(name_parts)
    
    # Check if user exists by Apple ID
    existing_user = await db.users.find_one({"apple_user_id": apple_user_id}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update name only if we got a new one
        update_data = {}
        if user_name != "Apple Kullanıcı" and existing_user.get("name") == "Apple Kullanıcı":
            update_data["name"] = user_name
        if email and not existing_user.get("email"):
            update_data["email"] = email
        
        if update_data:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )
    else:
        # Check if user exists by email (might have signed up with Google before)
        if email:
            existing_email_user = await db.users.find_one({"email": email}, {"_id": 0})
            if existing_email_user:
                # Link Apple ID to existing account
                user_id = existing_email_user["user_id"]
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "apple_user_id": apple_user_id,
                        "auth_providers": list(set(existing_email_user.get("auth_providers", ["google"]) + ["apple"]))
                    }}
                )
            else:
                # Create new user
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                await db.users.insert_one({
                    "user_id": user_id,
                    "apple_user_id": apple_user_id,
                    "email": email,
                    "name": user_name,
                    "picture": "",
                    "subscription_tier": "free",
                    "auth_providers": ["apple"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        else:
            # Create new user without email
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "apple_user_id": apple_user_id,
                "email": f"{apple_user_id}@privaterelay.appleid.com",  # Placeholder
                "name": user_name,
                "picture": "",
                "subscription_tier": "free",
                "auth_providers": ["apple"],
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    # Generate session token
    session_token = f"apple_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Clear old sessions and create new one
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "auth_provider": "apple",
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
            "name": user.get("name", "Apple Kullanıcı"),
            "picture": user.get("picture", ""),
            "subscription_tier": user.get("subscription_tier", "free"),
            "created_at": user.get("created_at", ""),
            "auth_provider": "apple"
        },
        "session_token": session_token
    }


@router.get("/config")
async def get_apple_config():
    """Get Apple Sign-In configuration for frontend"""
    return {
        "clientId": APPLE_CLIENT_ID,
        "teamId": APPLE_TEAM_ID,
        "redirectUri": os.environ.get('APPLE_REDIRECT_URI', ''),
        "scope": "name email"
    }
