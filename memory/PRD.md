# Çocuk Kitapları - Product Requirements Document

## Original Problem Statement
Build a clone of the "TRT Çocuk Kitaplık" mobile application for iOS and Android. The clone should be a pixel-perfect replica of the original app's design, layout, and functionality, rebranded as "Çocuk Kitapları".

## User Personas
- **Children (3-10 years)**: Primary users who read illustrated Turkish children's books with audio narration
- **Parents**: Secondary users who manage profiles, track reading progress, and configure settings

## Core Requirements

### UI/UX
- ✅ Main screen with decorated, floating "islands" for book categories
- ✅ Book carousels for recommendations
- ✅ Starry night background for book library view
- ⏳ Bookshelf-themed loading animation (not yet implemented)

### Book Reader
- ✅ Landscape mode with two-page spread
- ✅ Swipe gestures for page-turning
- ✅ Interactive circular hotspots on illustrations
- ✅ Settings modal with "Auto-Play" and "Resume/Continue" toggles

### Audio Features
- ✅ Each page has pre-generated TTS audio (Irem - Turkish Audiobook Narrator)
- ✅ Audio stored in database - no loading delays
- ✅ Auto-play turns page when audio finishes
- ✅ Audio waits for image to load before playing
- ✅ Image error fallback - audio plays even if image fails

### Admin Features
- ✅ Content Management Panel (İçerik Yönetimi)
- ✅ Add/view books and pages without burning TTS credits
- ✅ Generate audio for selected books via admin
- ✅ View categories
- ✅ Completion celebration with confetti animation
- ✅ Star badge and congratulations message (Turkish)
- ✅ Options to restart book or return home

### Branding & Content
- ✅ Rebranded to "Çocuk Kitapları" (removed TRT Çocuk references)
- ✅ "Oyunlar" (Games) section removed
- ✅ End-of-book quiz removed

## What's Been Implemented

### January 17, 2026 - Auto-Play Bug Fix
- **Fixed**: Critical auto-play bug where pages wouldn't advance after audio ended
- **Root Cause**: React closure issue - `handleAudioEnded` captured stale state values
- **Solution**: Used `useRef` pattern to always access latest state (autoPlayRef, currentPageRef, pagesRef)
- **Verified**: All auto-play tests passed - pages advance correctly, pause/resume works, celebration shows

### January 17, 2026 - Content Management & New Story
- **Fixed**: Pause button now properly pauses/resumes instead of restarting
- **Admin Panel**: Content management UI accessible from Profile → İçerik Yönetimi
- **New Book**: "Annemin Elleri" - heartwarming story with Kıvanç (11), Ela (9), and Saide (38)
- **Audio pre-generation**: Admin can generate audio for books via UI (saves credits)

### January 17, 2026 - Backend & Enhancements
- **Backend with MongoDB**: Full API implementation for books, categories, and progress
- **API Contracts**: Created `/app/contracts.md` with complete API documentation
- **Database Seeded**: 5 categories, 6 books, 5 pages populated in MongoDB
- **Frontend Integration**: Updated IslandMap, BookLibrary, BookReaderLandscape to use APIs
- **Audio Loading Indicator**: Visual progress indicator while TTS generates
- **Completion Celebration**: Confetti animation with stars when book is finished

### Previous Implementation
- Frontend-only React clone with mock data (now migrated to API)
- FastAPI backend for ElevenLabs TTS integration
- Home screen with category islands and book carousels
- Landscape book reader with swipe gestures and interactive hotspots
- Auto-play and Resume/Continue settings with localStorage persistence

## Architecture

```
/app
├── backend/
│   ├── models/
│   │   ├── book.py           # Book & Page models
│   │   ├── category.py       # Category models
│   │   └── progress.py       # Reading progress models
│   ├── routes/
│   │   ├── book_routes.py    # GET /api/books, /api/books/{id}/pages
│   │   ├── category_routes.py # GET /api/categories
│   │   ├── progress_routes.py # Reading progress CRUD
│   │   └── tts_routes.py     # TTS API endpoints
│   ├── services/
│   │   └── tts_service.py    # ElevenLabs integration
│   ├── seed_data.py          # Database seeder
│   ├── server.py             # FastAPI main
│   └── .env                  # ELEVENLABS_API_KEY, MONGO_URL
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── books/
    │   │   │   ├── BookReaderLandscape.jsx # Main reader with TTS
    │   │   │   ├── CompletionCelebration.jsx # NEW: Celebration screen
    │   │   │   └── ...
    │   │   └── home/
    │   │       └── IslandMap.jsx # Category islands
    │   ├── services/
    │   │   └── api.js          # NEW: API service layer
    │   ├── data/mockData.js    # Fallback mock data
    │   └── App.js
    └── .env                    # REACT_APP_BACKEND_URL
```

## API Endpoints

### Books
- `GET /api/books` - List all books (with filters)
- `GET /api/books/{id}` - Get single book
- `GET /api/books/{id}/pages` - Get book pages

### Categories
- `GET /api/categories` - List all categories

### Progress
- `GET /api/progress/{userId}` - Get user's reading progress
- `POST /api/progress` - Save progress
- `POST /api/progress/complete` - Mark book completed

### TTS
- `POST /api/tts/generate` - Generate audio (Valory voice)

## Database Collections

- `books` - Book metadata
- `pages` - Book pages with text and images
- `categories` - Category definitions
- `reading_progress` - User reading progress

## Third-Party Integrations
- **ElevenLabs TTS** - Turkish audio narration with **Irem** voice (ID: `NsFK0aDGLbVusA7tQfOB`)
  - Audio is pre-generated and stored in MongoDB
  - No runtime TTS calls needed during reading
- **MongoDB** - Database for all content, progress, and pre-generated audio

## Prioritized Backlog

### P1 - High Priority
- [ ] Wire up reading progress API to frontend (sync across devices)
- [ ] User profile management and authentication

### P2 - Medium Priority
- [ ] Bookshelf-themed loading animation
- [ ] Add more books to database
- [ ] Child-friendly profile avatars

### P3 - Low Priority / Future
- [ ] Offline mode support
- [ ] Push notifications for new books
- [ ] Parental controls
- [ ] Reading statistics dashboard

## Testing Notes
- Backend tests: `/app/tests/test_backend_api.py`
- Test results: `/app/test_reports/iteration_1.json`
- Playwright has issues with external images (ORB blocking in test env)

## Files Reference
- API contracts: `/app/contracts.md`
- Database seeder: `/app/backend/seed_data.py`
- API service: `/app/frontend/src/services/api.js`
