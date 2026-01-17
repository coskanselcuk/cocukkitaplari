"""
Pre-generate TTS audio for all book pages and store in MongoDB.
This eliminates loading time during reading since all audio is pre-cached.

Run with: python generate_audio.py
"""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from services.tts_service import generate_tts

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


async def generate_all_page_audio():
    """Generate TTS audio for all pages that don't have audio yet"""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("Error: MONGO_URL or DB_NAME not set in environment")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Fetching pages without audio...")
    
    # Find all pages that don't have audio yet
    cursor = db.pages.find({"$or": [{"audioUrl": None}, {"audioUrl": {"$exists": False}}]})
    pages = await cursor.to_list(length=1000)
    
    if not pages:
        print("All pages already have audio!")
        # Check if there are any pages at all
        total = await db.pages.count_documents({})
        print(f"Total pages in database: {total}")
        
        # List pages with audio
        with_audio = await db.pages.count_documents({"audioUrl": {"$ne": None, "$exists": True}})
        print(f"Pages with audio: {with_audio}")
        return
    
    print(f"Found {len(pages)} pages without audio. Generating...")
    
    for i, page in enumerate(pages):
        page_id = page.get('id')
        book_id = page.get('bookId')
        page_num = page.get('pageNumber')
        text = page.get('text', '')
        
        if not text:
            print(f"  Skipping page {page_id} - no text")
            continue
        
        print(f"  [{i+1}/{len(pages)}] Generating audio for Book {book_id}, Page {page_num}...")
        print(f"    Text: {text[:50]}...")
        
        try:
            # Generate TTS audio
            result = generate_tts(text)
            audio_url = result.get('audio_url')
            
            if audio_url:
                # Update page with audio URL
                await db.pages.update_one(
                    {"id": page_id},
                    {"$set": {"audioUrl": audio_url}}
                )
                print(f"    ✓ Audio saved ({len(audio_url)} chars)")
            else:
                print(f"    ✗ No audio generated")
                
        except Exception as e:
            print(f"    ✗ Error: {str(e)}")
    
    print("\nDone! All pages now have pre-generated audio.")
    client.close()


async def regenerate_all_audio():
    """Regenerate audio for ALL pages (useful when changing voice)"""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("Error: MONGO_URL or DB_NAME not set in environment")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Regenerating audio for ALL pages with new Irem voice...")
    
    cursor = db.pages.find({})
    pages = await cursor.to_list(length=1000)
    
    print(f"Found {len(pages)} pages. Generating audio...")
    
    for i, page in enumerate(pages):
        page_id = page.get('id')
        book_id = page.get('bookId')
        page_num = page.get('pageNumber')
        text = page.get('text', '')
        
        if not text:
            print(f"  Skipping page {page_id} - no text")
            continue
        
        print(f"  [{i+1}/{len(pages)}] Generating audio for Book {book_id}, Page {page_num}...")
        
        try:
            result = generate_tts(text)
            audio_url = result.get('audio_url')
            
            if audio_url:
                await db.pages.update_one(
                    {"id": page_id},
                    {"$set": {"audioUrl": audio_url}}
                )
                print(f"    ✓ Audio saved")
            else:
                print(f"    ✗ No audio generated")
                
        except Exception as e:
            print(f"    ✗ Error: {str(e)}")
    
    print("\nDone! All pages regenerated with Irem voice.")
    client.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--regenerate":
        print("=== REGENERATE ALL AUDIO ===")
        asyncio.run(regenerate_all_audio())
    else:
        print("=== GENERATE MISSING AUDIO ===")
        asyncio.run(generate_all_page_audio())
