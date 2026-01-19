"""
Seed script to populate MongoDB with initial book data
Run with: python seed_data.py
"""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Categories data
categories = [
    {
        "id": str(uuid.uuid4()),
        "slug": "bizim-kahramanlar",
        "name": "Bizim Kahramanlar",
        "description": "Kahramanların maceraları",
        "icon": "hero",
        "color": "#FF6B6B",
        "gradient": "from-red-400 to-orange-400",
        "islandImage": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop",
        "sortOrder": 1
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "doganin-masali",
        "name": "Doğanın Masalı",
        "description": "Doğa ve hayvan hikayeleri",
        "icon": "nature",
        "color": "#4ECDC4",
        "gradient": "from-green-400 to-teal-400",
        "islandImage": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=200&h=200&fit=crop",
        "sortOrder": 2
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "bizim-masallar",
        "name": "Bizim Masallar",
        "description": "Geleneksel Türk masalları",
        "icon": "fairytale",
        "color": "#FFE66D",
        "gradient": "from-yellow-400 to-amber-400",
        "islandImage": "https://images.unsplash.com/photo-1598618137594-8e7657a6ef6a?w=200&h=200&fit=crop",
        "sortOrder": 3
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "merakli-bilgin",
        "name": "Meraklı Bilgin",
        "description": "Bilim ve keşif hikayeleri",
        "icon": "science",
        "color": "#95E1D3",
        "gradient": "from-blue-400 to-cyan-400",
        "islandImage": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=200&h=200&fit=crop",
        "sortOrder": 4
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "hayatin-icinden",
        "name": "Hayatın İçinden",
        "description": "Günlük yaşam hikayeleri",
        "icon": "life",
        "color": "#F38181",
        "gradient": "from-pink-400 to-rose-400",
        "islandImage": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
        "sortOrder": 5
    }
]

# Books data
books = [
    {
        "id": "1",
        "title": "Pırıl ve Sihirli Orman",
        "author": "Çocuk Kitapları",
        "category": "bizim-kahramanlar",
        "coverImage": "https://images.unsplash.com/photo-1598618137594-8e7657a6ef6a?w=300&h=400&fit=crop",
        "description": "Pırıl sihirli ormanda yeni arkadaşlar ediniyor.",
        "ageGroup": "4-6",
        "duration": "8 dk",
        "hasAudio": True,
        "isNew": True,
        "rating": 4.8,
        "readCount": 1250,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "2",
        "title": "Rafadan Tayfa: Piknik Günü",
        "author": "Çocuk Kitapları",
        "category": "bizim-kahramanlar",
        "coverImage": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
        "description": "Tayfa piknikte eğlenceli bir gün geçiriyor.",
        "ageGroup": "6-8",
        "duration": "6 dk",
        "hasAudio": True,
        "isNew": False,
        "rating": 4.9,
        "readCount": 3420,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "3",
        "title": "Ege ile Gaga: Deniz Macerası",
        "author": "Çocuk Kitapları",
        "category": "bizim-kahramanlar",
        "coverImage": "https://images.unsplash.com/photo-1629992101753-56d196c8aabb?w=300&h=400&fit=crop",
        "description": "Ege ve Gaga denizde yeni keşifler yapıyor.",
        "ageGroup": "3-5",
        "duration": "5 dk",
        "hasAudio": True,
        "isNew": True,
        "rating": 4.7,
        "readCount": 890,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "4",
        "title": "Ormanın Şarkısı",
        "author": "Ayşe Yıldız",
        "category": "doganin-masali",
        "coverImage": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=300&h=400&fit=crop",
        "description": "Orman hayvanlarının müzikal macerası.",
        "ageGroup": "5-7",
        "duration": "7 dk",
        "hasAudio": True,
        "isNew": False,
        "rating": 4.6,
        "readCount": 2100,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "5",
        "title": "Küçük Sincap",
        "author": "Mehmet Kara",
        "category": "doganin-masali",
        "coverImage": "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=300&h=400&fit=crop",
        "description": "Küçük sincabın kış hazırlıkları.",
        "ageGroup": "3-5",
        "duration": "4 dk",
        "hasAudio": True,
        "isNew": True,
        "rating": 4.9,
        "readCount": 1560,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "6",
        "title": "Keloğlan ve Altın Elma",
        "author": "Halk Masalı",
        "category": "bizim-masallar",
        "coverImage": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
        "description": "Keloğlanın altın elma arayışı.",
        "ageGroup": "6-9",
        "duration": "10 dk",
        "hasAudio": True,
        "isNew": False,
        "rating": 4.8,
        "readCount": 4500,
        "totalPages": 5,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
]

# Pages for the first book (Pırıl ve Sihirli Orman)
book_pages = [
    {
        "id": str(uuid.uuid4()),
        "bookId": "1",
        "pageNumber": 1,
        "text": "Bir varmış, bir yokmuş. Güzel bir bahar gününde, küçük Pırıl ormana doğru yola çıkmış.",
        "image": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
        "hotspots": []
    },
    {
        "id": str(uuid.uuid4()),
        "bookId": "1",
        "pageNumber": 2,
        "text": "Ormanın derinliklerinde rengârenk çiçekler ve şarkı söyleyen kuşlar varmış.",
        "image": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=400&fit=crop",
        "hotspots": []
    },
    {
        "id": str(uuid.uuid4()),
        "bookId": "1",
        "pageNumber": 3,
        "text": "Pırıl, bir sincap ile karşılaşmış. 'Merhaba küçük sincap, adın ne?' diye sormuş.",
        "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
        "hotspots": []
    },
    {
        "id": str(uuid.uuid4()),
        "bookId": "1",
        "pageNumber": 4,
        "text": "'Benim adım Fındık!' demiş sincap. 'Sen kimsin?'",
        "image": "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=600&h=400&fit=crop",
        "hotspots": []
    },
    {
        "id": str(uuid.uuid4()),
        "bookId": "1",
        "pageNumber": 5,
        "text": "Pırıl ve Fındık birlikte ormanda maceraya atılmışlar. Çok güzel bir dostluk başlamış.",
        "image": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&h=400&fit=crop",
        "hotspots": []
    }
]


async def seed_database():
    """Seed the database with initial data"""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("Error: MONGO_URL or DB_NAME not set in environment")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Seeding database...")
    
    # Clear existing data
    await db.categories.delete_many({})
    await db.books.delete_many({})
    await db.pages.delete_many({})
    
    print("Cleared existing data")
    
    # Insert categories
    if categories:
        await db.categories.insert_many(categories)
        print(f"Inserted {len(categories)} categories")
    
    # Insert books
    if books:
        await db.books.insert_many(books)
        print(f"Inserted {len(books)} books")
    
    # Insert pages
    if book_pages:
        await db.pages.insert_many(book_pages)
        print(f"Inserted {len(book_pages)} pages")
    
    print("Database seeded successfully!")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
