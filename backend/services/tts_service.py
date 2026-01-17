from elevenlabs import ElevenLabs, VoiceSettings
import os
import base64
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Initialize ElevenLabs client
elevenlabs_api_key = os.environ.get('ELEVENLABS_API_KEY')
client = None

if elevenlabs_api_key:
    client = ElevenLabs(api_key=elevenlabs_api_key)
    logger.info("ElevenLabs client initialized successfully")
else:
    logger.warning("ELEVENLABS_API_KEY not found in environment")

# Turkish child-friendly voice settings
# Using a warm, friendly voice suitable for children's stories
DEFAULT_VOICE_SETTINGS = VoiceSettings(
    stability=0.75,  # More stable for consistent narration
    similarity_boost=0.75,
    style=0.5,  # Balanced style
    use_speaker_boost=True
)

# Irem - Young Turkish girl, ideal for audiobooks and storytelling
IREM_VOICE_ID = "NsFK0aDGLbVusA7tQfOB"

# Fallback voices if Valory is not available
FALLBACK_VOICES = [
    "EXAVITQu4vr4xnSDxMaL",  # Sarah - Mature, Reassuring
    "cgSgspJ2msm6clMCkdW9",  # Jessica - Playful, Bright, Warm
]

async def get_available_voices():
    """Get list of available voices"""
    if not client:
        return []
    
    try:
        voices_response = client.voices.get_all()
        return [{
            "voice_id": v.voice_id,
            "name": v.name,
            "category": v.category
        } for v in voices_response.voices]
    except Exception as e:
        logger.error(f"Error fetching voices: {e}")
        return []

async def generate_tts_audio(text: str, voice_id: str = None) -> dict:
    """
    Generate TTS audio for Turkish text
    Returns base64 encoded audio data
    """
    if not client:
        raise Exception("ElevenLabs client not initialized")
    
    # Use Valory voice by default (Intimate, Warm and Inviting)
    if not voice_id:
        voice_id = VALORY_VOICE_ID
    
    try:
        # Generate audio using multilingual model for Turkish support
        audio_generator = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_multilingual_v2",  # Best for Turkish
            voice_settings=DEFAULT_VOICE_SETTINGS
        )
        
        # Collect audio data
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        # Convert to base64
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        
        return {
            "audio_base64": audio_b64,
            "audio_url": f"data:audio/mpeg;base64,{audio_b64}",
            "text": text,
            "voice_id": voice_id
        }
        
    except Exception as e:
        logger.error(f"Error generating TTS: {e}")
        raise Exception(f"TTS generation failed: {str(e)}")

async def generate_book_page_audio(page_text: str, page_number: int, book_id: int) -> dict:
    """
    Generate audio for a specific book page
    Optimized for children's story narration
    """
    # Add slight pauses and warm tone for children's narration
    # ElevenLabs handles prosody naturally
    
    result = await generate_tts_audio(page_text)
    result["page_number"] = page_number
    result["book_id"] = book_id
    
    return result

async def generate_all_book_audio(book_pages: list, book_id: int) -> list:
    """
    Generate audio for all pages of a book
    """
    audio_results = []
    
    for page in book_pages:
        try:
            result = await generate_book_page_audio(
                page_text=page["text"],
                page_number=page["pageNumber"],
                book_id=book_id
            )
            audio_results.append(result)
        except Exception as e:
            logger.error(f"Error generating audio for page {page['pageNumber']}: {e}")
            audio_results.append({
                "page_number": page["pageNumber"],
                "book_id": book_id,
                "error": str(e)
            })
    
    return audio_results
