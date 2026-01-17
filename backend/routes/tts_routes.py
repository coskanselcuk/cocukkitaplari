from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
from services.tts_service import (
    generate_tts_audio, 
    generate_book_page_audio,
    generate_all_book_audio,
    get_available_voices
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tts", tags=["TTS"])

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None

class PageAudioRequest(BaseModel):
    text: str
    page_number: int
    book_id: int

class BookPagesRequest(BaseModel):
    pages: List[dict]
    book_id: int

class TTSResponse(BaseModel):
    audio_url: str
    text: str
    voice_id: str

@router.get("/voices")
async def list_voices():
    """Get available TTS voices"""
    try:
        voices = await get_available_voices()
        return {"voices": voices}
    except Exception as e:
        logger.error(f"Error listing voices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_audio(request: TTSRequest):
    """Generate TTS audio for given text"""
    try:
        result = await generate_tts_audio(request.text, request.voice_id)
        return result
    except Exception as e:
        logger.error(f"Error generating TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/page")
async def generate_page_audio(request: PageAudioRequest):
    """Generate TTS audio for a book page"""
    try:
        result = await generate_book_page_audio(
            page_text=request.text,
            page_number=request.page_number,
            book_id=request.book_id
        )
        return result
    except Exception as e:
        logger.error(f"Error generating page audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/book")
async def generate_book_audio(request: BookPagesRequest):
    """Generate TTS audio for all pages of a book"""
    try:
        results = await generate_all_book_audio(
            book_pages=request.pages,
            book_id=request.book_id
        )
        return {"pages": results}
    except Exception as e:
        logger.error(f"Error generating book audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
