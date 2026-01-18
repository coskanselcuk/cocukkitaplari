"""
Voice Routes for Çocuk Kitapları
Manages custom ElevenLabs voices for the admin
"""
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import os
import uuid
import httpx

router = APIRouter(prefix="/voices", tags=["voices"])

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')


def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


# Models
class VoiceCreate(BaseModel):
    elevenlabs_id: str  # The ElevenLabs Voice ID
    name: str  # Display name for the voice
    description: Optional[str] = ""  # Optional description
    is_default: bool = False  # If true, this is the default voice


class VoiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None


class VoiceResponse(BaseModel):
    id: str
    elevenlabs_id: str
    name: str
    description: str = ""
    is_default: bool = False
    verified: bool = False  # Whether we've verified this voice exists in ElevenLabs
    created_at: str


@router.get("")
async def get_all_voices():
    """Get all custom voices"""
    db = get_db()
    
    voices = await db.custom_voices.find({}, {"_id": 0}).sort("created_at", -1).to_list(length=100)
    
    return {"voices": voices}


@router.post("")
async def create_voice(voice_data: VoiceCreate):
    """Add a new custom voice"""
    db = get_db()
    
    # Check if voice ID already exists
    existing = await db.custom_voices.find_one({"elevenlabs_id": voice_data.elevenlabs_id})
    if existing:
        raise HTTPException(status_code=400, detail="Bu ses ID'si zaten eklenmiş")
    
    # Optionally verify the voice exists in ElevenLabs
    verified = False
    if ELEVENLABS_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.elevenlabs.io/v1/voices/{voice_data.elevenlabs_id}",
                    headers={"xi-api-key": ELEVENLABS_API_KEY}
                )
                if response.status_code == 200:
                    verified = True
                    # Get the actual name from ElevenLabs if user didn't provide one
                    el_data = response.json()
                    if not voice_data.name:
                        voice_data.name = el_data.get("name", "Unknown Voice")
        except Exception as e:
            print(f"Could not verify voice: {e}")
    
    # If this is set as default, unset other defaults
    if voice_data.is_default:
        await db.custom_voices.update_many({}, {"$set": {"is_default": False}})
    
    voice_id = f"voice_{uuid.uuid4().hex[:12]}"
    
    voice_doc = {
        "id": voice_id,
        "elevenlabs_id": voice_data.elevenlabs_id,
        "name": voice_data.name,
        "description": voice_data.description or "",
        "is_default": voice_data.is_default,
        "verified": verified,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.custom_voices.insert_one(voice_doc)
    
    return VoiceResponse(**voice_doc)


@router.put("/{voice_id}")
async def update_voice(voice_id: str, voice_data: VoiceUpdate):
    """Update a custom voice"""
    db = get_db()
    
    voice = await db.custom_voices.find_one({"id": voice_id}, {"_id": 0})
    if not voice:
        raise HTTPException(status_code=404, detail="Ses bulunamadı")
    
    # Build update dict
    update_data = {k: v for k, v in voice_data.model_dump().items() if v is not None}
    
    # If setting as default, unset other defaults
    if update_data.get("is_default"):
        await db.custom_voices.update_many(
            {"id": {"$ne": voice_id}}, 
            {"$set": {"is_default": False}}
        )
    
    if update_data:
        await db.custom_voices.update_one({"id": voice_id}, {"$set": update_data})
    
    updated = await db.custom_voices.find_one({"id": voice_id}, {"_id": 0})
    return VoiceResponse(**updated)


@router.delete("/{voice_id}")
async def delete_voice(voice_id: str):
    """Delete a custom voice"""
    db = get_db()
    
    result = await db.custom_voices.delete_one({"id": voice_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ses bulunamadı")
    
    return {"success": True, "message": "Ses silindi"}


@router.post("/{voice_id}/verify")
async def verify_voice(voice_id: str):
    """Verify a voice exists in ElevenLabs"""
    db = get_db()
    
    voice = await db.custom_voices.find_one({"id": voice_id}, {"_id": 0})
    if not voice:
        raise HTTPException(status_code=404, detail="Ses bulunamadı")
    
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API anahtarı yapılandırılmamış")
    
    try:
        async with httpx.AsyncClient() as client:
            # First try the direct voice endpoint (for user's own voices)
            response = await client.get(
                f"https://api.elevenlabs.io/v1/voices/{voice['elevenlabs_id']}",
                headers={"xi-api-key": ELEVENLABS_API_KEY}
            )
            
            if response.status_code == 200:
                el_data = response.json()
                await db.custom_voices.update_one(
                    {"id": voice_id},
                    {"$set": {"verified": True}}
                )
                return {
                    "success": True,
                    "verified": True,
                    "elevenlabs_name": el_data.get("name"),
                    "elevenlabs_category": el_data.get("category")
                }
            
            # If not found, try the shared voices endpoint (for library voices)
            response2 = await client.get(
                f"https://api.elevenlabs.io/v1/shared-voices",
                headers={"xi-api-key": ELEVENLABS_API_KEY},
                params={"page_size": 100}
            )
            
            if response2.status_code == 200:
                shared_data = response2.json()
                voices_list = shared_data.get("voices", [])
                found_voice = next(
                    (v for v in voices_list if v.get("voice_id") == voice['elevenlabs_id']),
                    None
                )
                if found_voice:
                    await db.custom_voices.update_one(
                        {"id": voice_id},
                        {"$set": {"verified": True}}
                    )
                    return {
                        "success": True,
                        "verified": True,
                        "elevenlabs_name": found_voice.get("name"),
                        "elevenlabs_category": found_voice.get("category"),
                        "note": "Bu ses Voice Library'den. Kullanmak için ElevenLabs'ta 'Add to My Voices' yapmanız gerekebilir."
                    }
            
            # Voice not found anywhere
            await db.custom_voices.update_one(
                {"id": voice_id},
                {"$set": {"verified": False}}
            )
            return {
                "success": False,
                "verified": False,
                "message": "Ses ElevenLabs'te bulunamadı. Voice Library'den bir ses kullanıyorsanız, önce 'Add to My Voices' ile hesabınıza ekleyin."
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Doğrulama hatası: {str(e)}")


@router.get("/default")
async def get_default_voice():
    """Get the default voice"""
    db = get_db()
    
    voice = await db.custom_voices.find_one({"is_default": True}, {"_id": 0})
    
    if not voice:
        # Return the hardcoded default if no custom default is set
        return {
            "id": "default",
            "elevenlabs_id": "NsFK0aDGLbVusA7tQfOB",  # Irem
            "name": "Irem (Varsayılan)",
            "description": "Audiobook Narrator",
            "is_default": True,
            "verified": True
        }
    
    return voice


@router.post("/set-default/{voice_id}")
async def set_default_voice(voice_id: str):
    """Set a voice as the default"""
    db = get_db()
    
    voice = await db.custom_voices.find_one({"id": voice_id}, {"_id": 0})
    if not voice:
        raise HTTPException(status_code=404, detail="Ses bulunamadı")
    
    # Unset all defaults
    await db.custom_voices.update_many({}, {"$set": {"is_default": False}})
    
    # Set this voice as default
    await db.custom_voices.update_one({"id": voice_id}, {"$set": {"is_default": True}})
    
    return {"success": True, "message": f"'{voice['name']}' varsayılan ses olarak ayarlandı"}
