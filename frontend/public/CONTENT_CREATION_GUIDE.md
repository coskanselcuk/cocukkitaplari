# Çocuk Kitapları - Content Creation Guide

This document provides comprehensive instructions for creating books, managing voices, and generating audio in the Çocuk Kitapları app.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Voice Management](#voice-management)
3. [Book Creator Wizard (UI)](#book-creator-wizard-ui)
4. [Bulk Audio Generation](#bulk-audio-generation)
5. [API Reference](#api-reference)
   - [Authentication](#authentication)
   - [Voice APIs](#voice-apis)
   - [Book APIs](#book-apis)
   - [Page APIs](#page-apis)
   - [Audio Generation APIs](#audio-generation-apis)
6. [Complete Examples](#complete-examples)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Base URL
```
Production: https://your-railway-url.railway.app
Preview: Check your frontend/.env for REACT_APP_BACKEND_URL
```

### API Prefix
All API endpoints are prefixed with `/api`. For example:
```
GET /api/books
POST /api/admin/books/create-complete
```

---

## Voice Management

### Via Admin Panel (UI)
1. Login as admin → Profile → İçerik Yönetimi
2. Click "Sesler" tab
3. Click "ElevenLabs'tan Al" to fetch voices from your ElevenLabs account
4. Click "Ekle" on any voice to import it
5. Use "Önizle" button to preview voice before importing

### Via API
See [Voice APIs](#voice-apis) section below.

---

## Book Creator Wizard (UI)

### Access
1. Login as admin
2. Go to Profile → İçerik Yönetimi
3. Click "Sihirbaz" (purple button)

### Steps

#### Step 1: Book Info
- **Title** (required): Book title
- **Author**: Defaults to "Çocuk Kitapları"
- **Category**: Select from available categories
- **Cover Image** (required): Upload or provide URL
- **Description**: Optional book description
- **Age Group**: 2-4, 4-6, 6-8, or 8+
- **Reading Time**: e.g., "5 dk"
- **Premium**: Toggle for premium content

#### Step 2: Pages
Two input modes:

**Manual Mode:**
- Add pages one by one
- For each page: Enter text + Upload image or provide URL

**Bulk Text Mode:**
1. Select separator (---, [PAGE], ===, ***, [SAYFA])
2. Paste entire story with separators between pages
3. Click "Sayfalara Ayır" to split
4. Add images to each page

#### Step 3: Voice Settings
- Select default voice for the book
- Optionally enable per-page voice override
- Choose whether to generate audio immediately

#### Step 4: Review & Create
- Review all settings
- Click "Kitabı Oluştur"

---

## Bulk Audio Generation

### Via Admin Panel (UI)
1. Select a book in admin panel
2. Click "Toplu Ses Oluştur" (purple button)
3. Select voice (or use default)
4. Optionally check "Mevcut sesleri de yeniden oluştur"
5. Click generate button
6. Watch real-time progress

### Via API
See [Audio Generation APIs](#audio-generation-apis) section below.

---

## API Reference

### Authentication

Currently, admin APIs don't require authentication tokens in the preview environment. In production, you may need to implement authentication headers.

### Voice APIs

#### List All Custom Voices
```http
GET /api/voices
```

**Response:**
```json
{
  "voices": [
    {
      "id": "voice_abc123",
      "elevenlabs_id": "NsFK0aDGLbVusA7tQfOB",
      "name": "Irem",
      "description": "Young Turkish girl voice",
      "preview_url": "https://...",
      "is_default": true,
      "verified": true
    }
  ]
}
```

#### Fetch Voices from ElevenLabs Account
```http
GET /api/voices/elevenlabs
```

**Response:**
```json
{
  "voices": [
    {
      "voice_id": "NsFK0aDGLbVusA7tQfOB",
      "name": "Irem",
      "category": "premade",
      "description": "Young Turkish girl",
      "preview_url": "https://...",
      "labels": {"accent": "turkish", "age": "young"},
      "already_added": false
    }
  ],
  "total": 24
}
```

#### Import Voice from ElevenLabs
```http
POST /api/voices/import-from-elevenlabs
Content-Type: application/json

{
  "voice_id": "NsFK0aDGLbVusA7tQfOB",
  "name": "Irem",
  "category": "premade",
  "preview_url": "https://..."
}
```

#### Create Custom Voice (Manual)
```http
POST /api/voices
Content-Type: application/json

{
  "elevenlabs_id": "your_voice_id",
  "name": "My Custom Voice",
  "description": "Description here",
  "is_default": false
}
```

#### Set Default Voice
```http
POST /api/voices/set-default/{voice_id}
```

#### Delete Voice
```http
DELETE /api/voices/{voice_id}
```

---

### Book APIs

#### List All Books
```http
GET /api/books
GET /api/books?category=bizim-masallar
GET /api/books?ageGroup=4-6
GET /api/books?limit=10&offset=0
```

#### Get Single Book
```http
GET /api/books/{book_id}
```

#### Create Book (Simple)
```http
POST /api/books
Content-Type: application/json

{
  "title": "Küçük Prens",
  "author": "Antoine de Saint-Exupéry",
  "category": "klasik-masallar",
  "coverImage": "https://example.com/cover.jpg",
  "description": "Ünlü çocuk klasiği",
  "ageGroup": "6-8",
  "duration": "15 dk",
  "isPremium": false,
  "isNew": true
}
```

#### ⭐ Create Complete Book with Pages (Recommended)
```http
POST /api/admin/books/create-complete
Content-Type: application/json

{
  "title": "Küçük Kırmızı Balık",
  "author": "Çocuk Kitapları",
  "category": "bizim-masallar",
  "coverImage": "https://example.com/cover.jpg",
  "description": "Denizin derinliklerinde yaşayan küçük bir balığın hikayesi",
  "ageGroup": "4-6",
  "duration": "5 dk",
  "isPremium": false,
  "isNew": true,
  "pages": [
    {
      "text": "Bir varmış bir yokmuş, denizin derinliklerinde küçük kırmızı bir balık yaşarmış.",
      "imageUrl": "https://example.com/page1.jpg",
      "voiceId": null
    },
    {
      "text": "Bu balık her gün mercan kayalıkları arasında yüzer, yeni arkadaşlar ararmış.",
      "imageUrl": "https://example.com/page2.jpg",
      "voiceId": null
    },
    {
      "text": "Bir gün parlak bir ışık gördü. Bu ışık onu yepyeni maceralara götürecekti.",
      "imageUrl": "https://example.com/page3.jpg",
      "voiceId": null
    }
  ],
  "defaultVoiceId": "NsFK0aDGLbVusA7tQfOB",
  "generateAudio": false
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Book title |
| author | string | No | Author name (default: "Çocuk Kitapları") |
| category | string | No | Category slug (default: "bizim-masallar") |
| coverImage | string | Yes | Cover image URL |
| description | string | No | Book description |
| ageGroup | string | No | Age group: "2-4", "4-6", "6-8", "8+" |
| duration | string | No | Reading time (default: "5 dk") |
| isPremium | boolean | No | Premium content flag |
| isNew | boolean | No | New book badge |
| pages | array | Yes | Array of page objects |
| pages[].text | string | Yes | Page text content |
| pages[].imageUrl | string | Yes | Page image URL |
| pages[].voiceId | string | No | ElevenLabs voice ID for this page |
| defaultVoiceId | string | No | Default voice for all pages |
| generateAudio | boolean | No | Generate audio immediately (default: false) |

**Response:**
```json
{
  "success": true,
  "book": {
    "id": "uuid-here",
    "title": "Küçük Kırmızı Balık",
    "author": "Çocuk Kitapları",
    "category": "bizim-masallar",
    "coverImage": "https://example.com/cover.jpg",
    "description": "...",
    "ageGroup": "4-6",
    "duration": "5 dk",
    "isPremium": false,
    "isNew": true,
    "hasAudio": false,
    "rating": 0.0,
    "readCount": 0,
    "totalPages": 3,
    "createdAt": "2026-01-20T14:30:00Z"
  },
  "pages_created": 3,
  "audio_status": "not_requested"
}
```

#### Create Book from Text (Auto-split)
```http
POST /api/admin/books/create-from-text?title=Hikayem&separator=---&category=bizim-masallar
Content-Type: text/plain

Bir varmış bir yokmuş, uzak diyarlarda bir köy varmış.
---
Bu köyde küçük bir çocuk yaşarmış. Adı Ali imiş.
---
Ali her gün ormana gider, hayvanlarla konuşurmuş.
---
Bir gün ormanda büyülü bir kapı buldu.
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Book title |
| separator | string | No | Page separator (default: "---") |
| category | string | No | Category slug |
| cover_image | string | No | Cover image URL |
| default_voice_id | string | No | Voice ID for all pages |
| generate_audio | boolean | No | Generate audio immediately |

**Note:** This endpoint creates pages WITHOUT images. You must add images separately.

#### Update Book
```http
PUT /api/books/{book_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "isPremium": true
}
```

#### Delete Book
```http
DELETE /api/admin/books/{book_id}
```

---

### Page APIs

#### Get Book Pages
```http
GET /api/books/{book_id}/pages
```

**Response:**
```json
{
  "pages": [
    {
      "id": "page-uuid",
      "bookId": "book-uuid",
      "pageNumber": 1,
      "text": "Page text here",
      "imageUrl": "https://...",
      "audioUrl": "data:audio/mpeg;base64,...",
      "voiceId": "NsFK0aDGLbVusA7tQfOB"
    }
  ]
}
```

#### Add Page to Book
```http
POST /api/books/{book_id}/pages
Content-Type: application/json

{
  "pageNumber": 1,
  "text": "Page text content",
  "image": "https://example.com/page-image.jpg",
  "voiceId": "NsFK0aDGLbVusA7tQfOB"
}
```

#### Update Page
```http
PUT /api/books/{book_id}/pages/{page_id}
Content-Type: application/json

{
  "text": "Updated text",
  "image": "https://new-image-url.jpg",
  "voiceId": "different-voice-id"
}
```

#### Delete Page
```http
DELETE /api/admin/pages/{page_id}
```

---

### Audio Generation APIs

#### Generate Audio for All Pages (Standard)
```http
POST /api/admin/generate-audio/{book_id}
POST /api/admin/generate-audio/{book_id}?voice_id=NsFK0aDGLbVusA7tQfOB
POST /api/admin/generate-audio/{book_id}?regenerate_all=true
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| voice_id | string | Override voice for all pages |
| regenerate_all | boolean | Regenerate even if audio exists |

**Response:**
```json
{
  "message": "Audio generated for 5 pages",
  "success_count": 5,
  "error_count": 0,
  "total": 5
}
```

#### Generate Audio with Real-time Progress (SSE)
```http
GET /api/admin/generate-audio-stream/{book_id}
GET /api/admin/generate-audio-stream/{book_id}?voice_id=xxx&regenerate_all=true
```

**Server-Sent Events Response:**
```
data: {"type": "start", "total": 5, "message": "Generating audio for 5 pages..."}

data: {"type": "progress", "current": 1, "total": 5, "page": 1, "status": "generating"}

data: {"type": "progress", "current": 1, "total": 5, "page": 1, "status": "success"}

data: {"type": "progress", "current": 2, "total": 5, "page": 2, "status": "generating"}

data: {"type": "progress", "current": 2, "total": 5, "page": 2, "status": "success"}

... (continues for each page)

data: {"type": "complete", "success": 5, "errors": 0, "total": 5, "message": "Completed: 5 success, 0 errors"}
```

#### Generate Audio for Single Page
```http
POST /api/admin/generate-audio/{book_id}/page/{page_id}
```

---

### Category APIs

#### List Categories
```http
GET /api/categories
```

#### Create Category
```http
POST /api/categories
Content-Type: application/json

{
  "name": "Yeni Kategori",
  "slug": "yeni-kategori",
  "icon": "📚",
  "ageGroup": "4-6"
}
```

---

## Complete Examples

### Example 1: Create a Book with Audio using curl

```bash
# Set your API URL
API_URL="https://your-api-url.com"

# Step 1: Create the book with pages
RESPONSE=$(curl -s -X POST "$API_URL/api/admin/books/create-complete" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Uyuyan Güzel",
    "author": "Grimm Kardeşler",
    "category": "klasik-masallar",
    "coverImage": "https://example.com/sleeping-beauty-cover.jpg",
    "description": "Klasik peri masalı",
    "ageGroup": "4-6",
    "duration": "10 dk",
    "isPremium": false,
    "pages": [
      {
        "text": "Bir zamanlar, uzak bir krallıkta bir kral ve kraliçe yaşarmış.",
        "imageUrl": "https://example.com/page1.jpg"
      },
      {
        "text": "Onların çok güzel bir kızları varmış. Adını Aurora koymuşlardı.",
        "imageUrl": "https://example.com/page2.jpg"
      },
      {
        "text": "Prensesin doğum gününde, kötü kalpli bir cadı gelmiş.",
        "imageUrl": "https://example.com/page3.jpg"
      },
      {
        "text": "Cadı, prensese bir lanet atmış: On altı yaşında derin bir uykuya dalacakmış.",
        "imageUrl": "https://example.com/page4.jpg"
      },
      {
        "text": "Ama iyi kalpli bir peri, laneti hafifletmiş. Bir öpücükle prenses uyanabilecekmiş.",
        "imageUrl": "https://example.com/page5.jpg"
      }
    ],
    "defaultVoiceId": "NsFK0aDGLbVusA7tQfOB",
    "generateAudio": false
  }')

# Extract book ID
BOOK_ID=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['book']['id'])")
echo "Created book: $BOOK_ID"

# Step 2: Generate audio for all pages
curl -X POST "$API_URL/api/admin/generate-audio/$BOOK_ID"
```

### Example 2: Create Book from Plain Text

```bash
API_URL="https://your-api-url.com"

# Create book by splitting text
curl -X POST "$API_URL/api/admin/books/create-from-text" \
  -H "Content-Type: text/plain" \
  -G \
  --data-urlencode "title=Kaplumbağa ile Tavşan" \
  --data-urlencode "separator=---" \
  --data-urlencode "category=hayvan-masallari" \
  -d 'Bir gün tavşan ile kaplumbağa yarışmaya karar verdiler.
---
Tavşan çok hızlıydı ama kibirliydi. "Ben her zaman kazanırım!" dedi.
---
Yarış başladı. Tavşan hızla koştu ama sonra bir ağacın altında uyudu.
---
Kaplumbağa yavaş ama kararlı adımlarla yürüdü. Hiç durmadı.
---
Sonunda kaplumbağa kazandı! Yavaş ve kararlı olan yarışı kazanır.'
```

### Example 3: Python Script for Batch Book Creation

```python
import requests
import json

API_URL = "https://your-api-url.com/api"

def create_book(title, pages_data, category="bizim-masallar", voice_id=None):
    """
    Create a complete book with pages.
    
    pages_data: list of dicts with 'text' and 'imageUrl' keys
    """
    payload = {
        "title": title,
        "author": "Çocuk Kitapları",
        "category": category,
        "coverImage": pages_data[0]["imageUrl"] if pages_data else "",
        "ageGroup": "4-6",
        "duration": f"{len(pages_data) * 2} dk",
        "isPremium": False,
        "isNew": True,
        "pages": pages_data,
        "defaultVoiceId": voice_id,
        "generateAudio": False
    }
    
    response = requests.post(
        f"{API_URL}/admin/books/create-complete",
        json=payload
    )
    
    return response.json()

def generate_audio(book_id, voice_id=None):
    """Generate audio for all pages of a book."""
    params = {}
    if voice_id:
        params["voice_id"] = voice_id
    
    response = requests.post(
        f"{API_URL}/admin/generate-audio/{book_id}",
        params=params
    )
    
    return response.json()

def get_voices():
    """Get all available voices."""
    response = requests.get(f"{API_URL}/voices")
    return response.json()["voices"]

# Example usage
if __name__ == "__main__":
    # Get available voices
    voices = get_voices()
    print(f"Available voices: {[v['name'] for v in voices]}")
    
    # Create a book
    pages = [
        {"text": "Sayfa 1 metni", "imageUrl": "https://via.placeholder.com/800x600"},
        {"text": "Sayfa 2 metni", "imageUrl": "https://via.placeholder.com/800x600"},
        {"text": "Sayfa 3 metni", "imageUrl": "https://via.placeholder.com/800x600"},
    ]
    
    result = create_book("Test Kitabı", pages)
    print(f"Book created: {result['book']['id']}")
    
    # Generate audio
    if result["success"]:
        audio_result = generate_audio(result["book"]["id"])
        print(f"Audio: {audio_result}")
```

### Example 4: Using with Another AI (Prompt Template)

If you're using another AI to help create content, here's a prompt template:

```
I need to create a children's book for the Çocuk Kitapları app. Please help me:

1. Generate a story with [NUMBER] pages for ages [AGE_GROUP]
2. Each page should have 1-3 sentences (suitable for children)
3. Format the output as JSON that I can send to the API:

{
  "title": "[STORY_TITLE]",
  "author": "[AUTHOR_NAME]",
  "category": "[CATEGORY: bizim-masallar, klasik-masallar, hayvan-masallari, etc.]",
  "coverImage": "[COVER_IMAGE_URL]",
  "description": "[SHORT_DESCRIPTION]",
  "ageGroup": "[2-4, 4-6, 6-8, or 8+]",
  "duration": "[X dk]",
  "isPremium": false,
  "pages": [
    {"text": "[PAGE_1_TEXT]", "imageUrl": "[PAGE_1_IMAGE_URL]"},
    {"text": "[PAGE_2_TEXT]", "imageUrl": "[PAGE_2_IMAGE_URL]"},
    ...
  ],
  "generateAudio": false
}

Story theme: [YOUR_THEME]
```

---

## Troubleshooting

### Common Errors

#### "No pages found for this book"
- The book exists but has no pages
- Solution: Add pages using POST /api/books/{book_id}/pages

#### "Page has no text"
- Trying to generate audio for a page with empty text
- Solution: Update the page with text content first

#### "ElevenLabs API error"
- API key invalid or quota exceeded
- Solution: Check ELEVENLABS_API_KEY in backend/.env

#### "Field required" errors
- Missing required fields in request
- Solution: Check the API documentation for required fields

### Checking Logs

```bash
# Backend logs
tail -100 /var/log/supervisor/backend.err.log

# Check if backend is running
sudo supervisorctl status backend
```

### Testing API Connectivity

```bash
# Test basic connectivity
curl -s https://your-api-url.com/api/books | head -c 100

# Test with verbose output
curl -v https://your-api-url.com/api/books
```

---

## Available Categories

| Slug | Name (Turkish) |
|------|----------------|
| bizim-masallar | Bizim Masallar |
| klasik-masallar | Klasik Masallar |
| hayvan-masallari | Hayvan Masalları |
| uyku-masallari | Uyku Masalları |
| egitici-hikayeler | Eğitici Hikayeler |

To get the current list:
```bash
curl -s https://your-api-url.com/api/categories
```

---

## Voice IDs Reference

### Default Voice
- **Irem** (Young Turkish girl): `NsFK0aDGLbVusA7tQfOB`

### Getting Your Voices
```bash
# List voices in your ElevenLabs account
curl -s https://your-api-url.com/api/voices/elevenlabs

# List voices you've imported
curl -s https://your-api-url.com/api/voices
```

---

## Rate Limits & Best Practices

1. **Audio Generation**: ElevenLabs has API rate limits. Generate audio in batches if creating many books.

2. **Image URLs**: Use reliable image hosting (Cloudinary recommended). Broken image URLs will cause display issues.

3. **Text Length**: Keep page text short (1-3 sentences) for young children. Longer text is fine for 6+ age groups.

4. **Batch Creation**: When creating multiple books, add a small delay between requests:
   ```python
   import time
   for book in books_to_create:
       create_book(book)
       time.sleep(1)  # 1 second delay
   ```

---

*Last updated: January 20, 2026*
