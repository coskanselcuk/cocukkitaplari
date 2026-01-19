from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone, timedelta
import asyncio
from contextlib import asynccontextmanager

# Import routes
from routes.tts_routes import router as tts_router
from routes.book_routes import router as book_router
from routes.category_routes import router as category_router
from routes.progress_routes import router as progress_router
from routes.admin_routes import router as admin_router
from routes.auth_routes import router as auth_router
from routes.apple_auth_routes import router as apple_auth_router
from routes.google_auth_routes import router as google_auth_router
from routes.upload_routes import router as upload_router
from routes.subscription_routes import router as subscription_router
from routes.notification_routes import router as notification_router
from routes.voice_routes import router as voice_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


# ============ ENVIRONMENT VARIABLE VALIDATION ============

def validate_env_vars():
    """Validate all required environment variables at startup"""
    required_vars = {
        'MONGO_URL': 'MongoDB connection string (e.g., mongodb+srv://...)',
        'DB_NAME': 'Database name (e.g., cocuk_kitaplari)',
    }
    
    optional_vars = {
        'CORS_ORIGINS': ('Allowed CORS origins', '*'),
        'ELEVENLABS_API_KEY': ('ElevenLabs API key for TTS', None),
        'CLOUDINARY_CLOUD_NAME': ('Cloudinary cloud name', None),
        'CLOUDINARY_API_KEY': ('Cloudinary API key', None),
        'CLOUDINARY_API_SECRET': ('Cloudinary API secret', None),
        'AUTH_SERVICE_URL': ('OAuth service URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'),
    }
    
    missing = []
    warnings = []
    
    # Check required variables
    for var, description in required_vars.items():
        value = os.environ.get(var)
        if not value:
            missing.append(f"  - {var}: {description}")
    
    # Check optional variables and warn if missing
    for var, (description, default) in optional_vars.items():
        value = os.environ.get(var)
        if not value and default is None:
            warnings.append(f"  - {var}: {description}")
    
    # Report errors
    if missing:
        error_msg = (
            "\n" + "=" * 60 + "\n"
            "❌ MISSING REQUIRED ENVIRONMENT VARIABLES\n"
            "=" * 60 + "\n"
            "The following required variables are not set:\n\n"
            + "\n".join(missing) + "\n\n"
            "Please create a .env file in the backend directory.\n"
            "See backend/.env.example for reference.\n"
            "=" * 60
        )
        raise ValueError(error_msg)
    
    # Report warnings
    if warnings:
        warning_msg = (
            "\n" + "=" * 60 + "\n"
            "⚠️  OPTIONAL ENVIRONMENT VARIABLES NOT SET\n"
            "=" * 60 + "\n"
            "The following optional features may not work:\n\n"
            + "\n".join(warnings) + "\n\n"
            "See backend/.env.example for reference.\n"
            "=" * 60
        )
        print(warning_msg)
    
    return True


# Run validation at startup
validate_env_vars()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============ TRIAL EXPIRATION NOTIFICATION TASK ============

async def check_expiring_trials():
    """
    Background task to check for expiring trials and send notifications.
    Runs every hour and notifies users when:
    - Trial expires in 3 days (first reminder)
    - Trial expires in 1 day (urgent reminder)
    - Trial has expired (final notice)
    """
    from routes.notification_routes import create_system_notification
    
    while True:
        try:
            logger.info("Checking for expiring trials...")
            
            now = datetime.now(timezone.utc)
            
            # Find users with active trials
            trial_users = await db.users.find({
                "is_trial": True,
                "trial_ends_at": {"$exists": True}
            }, {"_id": 0}).to_list(length=1000)
            
            for user in trial_users:
                user_id = user.get("user_id")
                trial_ends_at_str = user.get("trial_ends_at")
                
                if not trial_ends_at_str:
                    continue
                
                try:
                    trial_ends_at = datetime.fromisoformat(trial_ends_at_str.replace('Z', '+00:00'))
                except Exception:
                    continue
                
                days_remaining = (trial_ends_at - now).days
                hours_remaining = (trial_ends_at - now).total_seconds() / 3600
                
                # Check if we already sent a notification for this milestone
                notification_key = f"trial_reminder_{user_id}_{days_remaining}"
                existing_notif = await db.sent_trial_notifications.find_one({
                    "user_id": user_id,
                    "days_remaining": days_remaining
                })
                
                if existing_notif:
                    continue  # Already sent notification for this milestone
                
                # Determine notification type based on days remaining
                if days_remaining == 3:
                    await create_system_notification(
                        title="Deneme Süreniz Bitiyor! ⏰",
                        message="Premium denemeniz 3 gün içinde sona erecek. Abone olarak tüm kitaplara erişiminizi sürdürün!",
                        notif_type="trial",
                        target_user_id=user_id
                    )
                    await db.sent_trial_notifications.insert_one({
                        "user_id": user_id,
                        "days_remaining": 3,
                        "sent_at": now.isoformat()
                    })
                    logger.info(f"Sent 3-day trial reminder to user {user_id}")
                    
                elif days_remaining == 1:
                    await create_system_notification(
                        title="Son 1 Gün! ⚠️",
                        message="Premium denemeniz yarın sona eriyor! Hemen abone olun ve kesintisiz okumaya devam edin.",
                        notif_type="trial",
                        target_user_id=user_id
                    )
                    await db.sent_trial_notifications.insert_one({
                        "user_id": user_id,
                        "days_remaining": 1,
                        "sent_at": now.isoformat()
                    })
                    logger.info(f"Sent 1-day trial reminder to user {user_id}")
                    
                elif days_remaining <= 0 and hours_remaining > -24:
                    # Trial just expired (within last 24 hours)
                    existing_expired = await db.sent_trial_notifications.find_one({
                        "user_id": user_id,
                        "days_remaining": 0
                    })
                    if not existing_expired:
                        await create_system_notification(
                            title="Deneme Süreniz Bitti 😔",
                            message="Premium denemeniz sona erdi. Premium kitaplara erişmek için abone olun!",
                            notif_type="trial",
                            target_user_id=user_id
                        )
                        await db.sent_trial_notifications.insert_one({
                            "user_id": user_id,
                            "days_remaining": 0,
                            "sent_at": now.isoformat()
                        })
                        logger.info(f"Sent trial expired notification to user {user_id}")
                        
                        # Update user's trial status
                        await db.users.update_one(
                            {"user_id": user_id},
                            {"$set": {
                                "is_trial": False,
                                "subscription_tier": "free"
                            }}
                        )
            
            logger.info(f"Trial check complete. Checked {len(trial_users)} users.")
            
        except Exception as e:
            logger.error(f"Error in trial expiration check: {e}")
        
        # Run every hour
        await asyncio.sleep(3600)


# Background task reference
trial_check_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    global trial_check_task
    
    # Startup
    logger.info("Starting trial expiration notification task...")
    trial_check_task = asyncio.create_task(check_expiring_trials())
    
    yield
    
    # Shutdown
    logger.info("Shutting down trial expiration notification task...")
    if trial_check_task:
        trial_check_task.cancel()
        try:
            await trial_check_task
        except asyncio.CancelledError:
            pass
    client.close()


# Create the main app with lifespan
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

# Include all routers
app.include_router(tts_router, prefix="/api")
app.include_router(book_router, prefix="/api")
app.include_router(category_router, prefix="/api")
app.include_router(progress_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(apple_auth_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(subscription_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(voice_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Note: Shutdown is handled by lifespan context manager above