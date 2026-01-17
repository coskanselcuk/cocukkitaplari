"""
Add a new heartwarming book: "Annemin Elleri" (My Mother's Hands)
Featuring: Kıvanç (11), Ela (9), and their mother Saide (38)
"""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from services.tts_service import generate_tts_audio
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


async def add_new_book():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    book_id = "annemin-elleri"
    
    # Check if book already exists
    existing = await db.books.find_one({"id": book_id})
    if existing:
        print("Book already exists. Deleting and recreating...")
        await db.books.delete_one({"id": book_id})
        await db.pages.delete_many({"bookId": book_id})
    
    # Create the book
    book = {
        "id": book_id,
        "title": "Annemin Elleri",
        "author": "Çocuk Kitapları",
        "category": "hayatin-icinden",
        "coverImage": "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=300&h=400&fit=crop",
        "description": "Kıvanç ve Ela, annelerinin ellerinin ne kadar özel olduğunu keşfediyorlar.",
        "ageGroup": "6-9",
        "duration": "6 dk",
        "hasAudio": True,
        "isNew": True,
        "rating": 5.0,
        "readCount": 0,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    
    # Create pages with heartwarming Turkish story
    pages = [
        {
            "id": str(uuid.uuid4()),
            "bookId": book_id,
            "pageNumber": 1,
            "text": "On bir yaşındaki Kıvanç ve dokuz yaşındaki kardeşi Ela, bir pazar sabahı mutfakta anneleri Saide'yi izliyorlardı. Anneleri her zamanki gibi kahvaltı hazırlıyordu.",
            "image": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
            "hotspots": []
        },
        {
            "id": str(uuid.uuid4()),
            "bookId": book_id,
            "pageNumber": 2,
            "text": "'Anne, senin ellerin neden bu kadar yumuşak?' diye sordu Ela. Saide gülümsedi. 'Çünkü bu eller sizi her gün sevgiyle sarılır, yemeklerinizi pişirir ve yorulduğunuzda başınızı okşar.'",
            "image": "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=600&h=400&fit=crop",
            "hotspots": []
        },
        {
            "id": str(uuid.uuid4()),
            "bookId": book_id,
            "pageNumber": 3,
            "text": "Kıvanç annesinin ellerine baktı. 'Ben de senin gibi güçlü olmak istiyorum anne,' dedi. Saide oğlunun ellerini tuttu. 'Sen zaten güçlüsün oğlum. Kardeşine nasıl yardım ettiğini görüyorum.'",
            "image": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop",
            "hotspots": []
        },
        {
            "id": str(uuid.uuid4()),
            "bookId": book_id,
            "pageNumber": 4,
            "text": "Ela annesine sarıldı. 'Ben de seni çok seviyorum anne!' Saide iki çocuğunu da kucakladı. 'Benim en büyük hazinem sizsiniz,' dedi gözleri dolarak.",
            "image": "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=400&fit=crop",
            "hotspots": []
        },
        {
            "id": str(uuid.uuid4()),
            "bookId": book_id,
            "pageNumber": 5,
            "text": "O günden sonra Kıvanç ve Ela, annelerinin her hareketinde ne kadar çok sevgi olduğunu fark ettiler. Çünkü bir annenin elleri, dünyanın en sıcak yeriydi.",
            "image": "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&h=400&fit=crop",
            "hotspots": []
        }
    ]
    
    # Insert book
    await db.books.insert_one(book)
    print(f"✓ Book '{book['title']}' created")
    
    # Insert pages and generate audio
    print("\nGenerating audio with Irem voice...")
    for page in pages:
        await db.pages.insert_one(page)
        print(f"  Page {page['pageNumber']}: Creating audio...")
        
        try:
            result = await generate_tts_audio(page['text'])
            audio_url = result.get('audio_url')
            
            if audio_url:
                await db.pages.update_one(
                    {"id": page['id']},
                    {"$set": {"audioUrl": audio_url}}
                )
                print(f"    ✓ Audio saved")
        except Exception as e:
            print(f"    ✗ Error: {e}")
    
    print(f"\n✓ Book '{book['title']}' ready with audio!")
    client.close()


if __name__ == "__main__":
    asyncio.run(add_new_book())
