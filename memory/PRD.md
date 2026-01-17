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
- ✅ Each page has own TTS audio (ElevenLabs Valory voice)
- ✅ Auto-play turns page when audio finishes
- ✅ Audio waits for image to load before playing (bug fixed Jan 2026)
- ✅ Image error fallback - audio plays even if image fails to load

### Branding & Content
- ✅ Rebranded to "Çocuk Kitapları" (removed TRT Çocuk references)
- ✅ "Oyunlar" (Games) section removed
- ✅ End-of-book quiz removed (Jan 2026)

## What's Been Implemented

### January 17, 2026 - Bug Fixes Session
- **Fixed**: Audio restart bug - audio now waits for page image to load before playing
- **Fixed**: Added `onError` handler for images so audio plays even if image fails
- **Removed**: BookQuiz.jsx and all quiz functionality
- **Verified**: Valory voice (ID: VhxAIIZM8IRmnl5fyeyk) working in TTS service
- **Simplified**: Cleaned up BookReaderLandscape.jsx with simpler state management

### Previous Implementation
- Frontend-only React clone with mock data
- FastAPI backend for ElevenLabs TTS integration
- Home screen with category islands and book carousels
- Landscape book reader with swipe gestures and interactive hotspots
- Auto-play and Resume/Continue settings with localStorage persistence

## Architecture

```
/app
├── backend/
│   ├── routes/tts_routes.py    # TTS API endpoints
│   ├── services/tts_service.py # ElevenLabs integration
│   ├── server.py               # FastAPI main
│   └── .env                    # ELEVENLABS_API_KEY
└── frontend/
    ├── src/
    │   ├── components/books/   # BookReaderLandscape, BookLibrary, etc.
    │   ├── components/home/    # IslandMap
    │   ├── data/mockData.js    # MOCKED book data
    │   └── App.js
    └── .env                    # REACT_APP_BACKEND_URL
```

## Third-Party Integrations
- **ElevenLabs TTS** - Turkish audio narration with Valory voice (multilingual_v2 model)

## Prioritized Backlog

### P0 - Critical
- [ ] Build full backend with MongoDB (books, users, progress collections)
- [ ] Create `/app/contracts.md` with API endpoints and DB schema

### P1 - High Priority
- [ ] Migrate Resume/Continue from localStorage to backend
- [ ] User profile management and authentication

### P2 - Medium Priority
- [ ] Bookshelf-themed loading animation
- [ ] Sync reading progress across devices

### P3 - Low Priority / Future
- [ ] Offline mode support
- [ ] Push notifications for new books
- [ ] Parental controls

## Known Limitations
- **MOCKED**: All book data is in `/app/frontend/src/data/mockData.js` - no database yet
- **No Auth**: No user authentication implemented
- **localStorage Only**: Reading progress stored locally, not synced

## Test Reports
- Backend tests: `/app/tests/test_backend_api.py` (9 tests passing)
- Test results: `/app/test_reports/iteration_1.json`

## Testing Notes
- Playwright/automated testing has issues with external Unsplash images (ORB blocking)
- Audio playback testing should be done in a real browser for accurate results
- TTS backend API is verified working via curl tests
