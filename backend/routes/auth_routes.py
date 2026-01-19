from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import httpx
import uuid
import os

router = APIRouter(prefix="/auth", tags=["auth"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
# Emergent OAuth service URL - defaults to production
AUTH_SERVICE_URL = os.environ.get('AUTH_SERVICE_URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


class SessionRequest(BaseModel):
    session_id: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    subscription_tier: str = "free"  # free or premium
    created_at: str


@router.post("/session")
async def exchange_session(request: SessionRequest, response: Response):
    """Exchange session_id from Google OAuth for session_token"""
    db = get_db()
    
    # Call Emergent auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                AUTH_SERVICE_URL,
                headers={"X-Session-ID": request.session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")
    
    email = auth_data.get("email")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture", "")
    session_token = auth_data.get("session_token")
    
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Invalid auth data")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data if changed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "subscription_tier": "free",  # Default to free tier
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.delete_many({"user_id": user_id})  # Clear old sessions
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Get user for response
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
        "user": UserResponse(**user).model_dump()
    }


@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user"""
    db = get_db()
    
    # Check cookie first, then header
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserResponse(**user).model_dump()


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    db = get_db()
    
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"success": True, "message": "Logged out"}


@router.post("/upgrade-to-premium/{user_id}")
async def upgrade_to_premium(user_id: str):
    """Admin endpoint to upgrade a user to premium (for testing/manual upgrades)"""
    db = get_db()
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"subscription_tier": "premium"}}
    )
    
    if result.matched_count == 0:
        # Try by email
        result = await db.users.update_one(
            {"email": user_id},
            {"$set": {"subscription_tier": "premium"}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "User upgraded to premium"}


@router.post("/downgrade-to-free/{user_id}")
async def downgrade_to_free(user_id: str):
    """Admin endpoint to downgrade a user to free tier"""
    db = get_db()
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"subscription_tier": "free"}}
    )
    
    if result.matched_count == 0:
        result = await db.users.update_one(
            {"email": user_id},
            {"$set": {"subscription_tier": "free"}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "User downgraded to free"}


@router.get("/users")
async def list_users():
    """Admin endpoint to list all users"""
    db = get_db()
    
    users = []
    async for user in db.users.find({}, {"_id": 0}):
        users.append(user)
    
    return {"users": users, "total": len(users)}


# Helper function for other routes to get current user
async def get_current_user_from_request(request: Request):
    """Helper to get current user from request - returns None if not authenticated"""
    db = get_db()
    
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    return user
