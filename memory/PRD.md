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
- ✅ Full CRUD for books (Create, Read, Update, Delete)
- ✅ Full CRUD for pages (Create, Read, Update, Delete)
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

### January 17, 2026 - Premium Content UI & Admin Access Control
- **Premium Content Visibility**: Non-premium users now clearly see locked content
  - Lock icon overlay on premium book covers with darkened image
  - Play button hidden for locked content
  - Book info modal shows "Premium'a Abone Ol" (Subscribe) button instead of "Başla"
  - Premium badge prominently displayed
- **Admin Access Control**: Restricted admin panel to coskanselcuk@gmail.com only
  - Added `isAdmin` check in AuthContext
  - "İçerik Yönetimi" button hidden for non-admin users
- **Content Cleanup**: Reorganized to 5 free + 5 premium books
  - Free: Rafadan Tayfa, Ege ile Gaga, Annemin Elleri, Pırıl ve Sihirli Orman, Minik Bulut
  - Premium: Ormanın Şarkısı, Küçük Sincap, Keloğlan ve Altın Elma, Ay Prensesi, Deniz Altı Macerası

### January 17, 2026 - Local Image Upload & Loading Animations
- **Local Image Upload**: Implemented file upload functionality in admin panel
  - New ImageUpload component with drag-and-drop support
  - Toggle between "Yükle" (Upload) and "URL" modes
  - Supports JPG, PNG, GIF, WEBP formats (max 10MB)
  - Backend API: POST /api/upload/image, GET/DELETE /api/upload/images/{filename}
  - Files stored in /app/backend/uploads/ directory
  - Integrated into Add Book, Edit Book, Add Page, Edit Page modals
- **Skeleton Loading Animations**: Added shimmer loading states
  - BookCardSkeleton component with shimmer effect
  - BookLibrary shows skeleton grid while fetching books
  - SearchModal shows skeleton grid while loading data
  - Matches the app's visual style (semi-transparent cards)
- **Testing**: All 7 upload API tests passed, all frontend features verified

### January 17, 2026 - Search Fix & Premium Badges
- **Search Fixed**: SearchModal now fetches from API instead of mock data
- **"Annemin Elleri"** and all other books now searchable
- **Premium Badges**: Added to BookCard component (golden with crown icon)
- **Library View**: Shows premium badges on books 4, 5, 6
- **Search Results**: Shows premium badges when searching

### January 17, 2026 - Subscription Management UI
- **Profile Page**: Added subscription status section (shows only when authenticated)
- **Free User View**: Shows benefits list and "Premium'a Yükselt" upgrade button
- **Premium User View**: Shows active benefits with checkmarks
- **Pricing**: Displayed as "Aylık ₺29.99" (placeholder for App Store pricing)
- **OAuth Flow Tested**: Login redirects to Emergent Auth → Google → back to app

### January 17, 2026 - User Authentication & Premium Content
- **Google OAuth**: Integrated Emergent-managed Google Auth for user login
- **User Model**: Created users collection with subscription_tier (free/premium)
- **Premium Books**: Books 4, 5, 6 marked as premium content
- **Access Control**: Non-premium users see "Premium İçerik" modal when trying to read premium books
- **Session Management**: Cookie-based sessions with 7-day expiry
- **Profile Page**: Shows Google login button, user info, and Premium badge for subscribers

### January 17, 2026 - Audio Generation & Progress Sync Testing
- **Generated Audio**: Book 4 "Ormanın Şarkısı" now has audio for all 5 pages
- **Progress Sync Verified**: Reading progress saves to backend and resumes correctly
- **Voice**: Using "Irem" (NsFK0aDGLbVusA7tQfOB) - Young Turkish audiobook narrator

### January 17, 2026 - Category CRUD
- **Full CRUD for Categories**: Create, Read, Update, Delete categories via Admin Panel
- **Updated model**: Made optional fields (description, color, gradient, islandImage) have defaults
- **UI improvements**: Categories tab shows name, slug, age group with edit/delete buttons

### January 17, 2026 - Backend Progress Sync & Book Pages Seeding
- **Progress API Integration**: BookReaderLandscape now saves/loads progress from backend
- **Debounced Saving**: Progress saves 1 second after page changes (avoids excessive API calls)
- **Fallback**: Uses localStorage if backend fails
- **Book Completion**: Marks books complete in backend when finished
- **Seeded Pages**: Added 5-page stories to all books (Rafadan Tayfa, Ege ile Gaga, Ormanın Şarkısı, Küçük Sincap, Keloğlan)
- **Fixed hotspots**: Added empty hotspots array to all pages for API compatibility

### January 17, 2026 - Admin Panel CRUD
- **Full CRUD for Books**: Create, Read, Update, Delete books via Admin Panel
- **Full CRUD for Pages**: Create, Read, Update, Delete pages for each book
- **Backend endpoints**: PUT /api/books/{id}, PUT /api/books/{id}/pages/{page_id}, DELETE endpoints
- **UI modals**: Edit Book modal, Edit Page modal, Delete confirmation dialog
- **Turkish UI**: All labels and messages in Turkish (Düzenle, Sil, Güncelle, etc.)

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
│   │   ├── tts_routes.py     # TTS API endpoints
│   │   ├── auth_routes.py    # Google OAuth authentication
│   │   └── upload_routes.py  # Image upload API (NEW)
│   ├── uploads/              # Uploaded images directory (NEW)
│   ├── services/
│   │   └── tts_service.py    # ElevenLabs integration
│   ├── seed_data.py          # Database seeder
│   ├── server.py             # FastAPI main
│   └── .env                  # ELEVENLABS_API_KEY, MONGO_URL
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/
    │   │   │   ├── AdminPanel.jsx    # Content management
    │   │   │   └── ImageUpload.jsx   # Drag-drop image upload (NEW)
    │   │   ├── books/
    │   │   │   ├── BookReaderLandscape.jsx # Main reader with TTS
    │   │   │   ├── BookCardSkeleton.jsx    # Skeleton loading (NEW)
    │   │   │   ├── CompletionCelebration.jsx # Celebration screen
    │   │   │   └── ...
    │   │   └── home/
    │   │       └── IslandMap.jsx # Category islands
    │   ├── services/
    │   │   └── api.js          # API service layer
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
- [x] Wire up reading progress API to frontend (sync across devices) ✅
- [x] Add CRUD for categories in admin panel ✅
- [x] Generate audio for newly seeded books ✅ (Book 4 done, others pending)
- [x] Test progress sync ✅

### P2 - Medium Priority
- [ ] Native in-app purchase integration (Apple StoreKit / Google Play Billing)
- [ ] Bookshelf-themed loading animation
- [ ] Add more books to database
- [ ] Child-friendly profile avatars

### P3 - Low Priority / Future
- [ ] Offline mode support
- [ ] Push notifications for new books
- [ ] Parental controls
- [ ] Reading statistics dashboard

### P4 - Enhancement Ideas (Backlog)
- [ ] Bulk audio generation - select multiple books and generate TTS for all at once
- [ ] Reading streak feature - show consecutive reading days with star rewards
- [x] **Local image upload for book covers and pages** ✅ COMPLETED
- [ ] Drag-and-drop page reordering in admin panel
- [ ] Book preview mode in admin before publishing

## Testing Notes
- Backend tests: `/app/tests/test_backend_api.py`, `/app/tests/test_upload_api.py`
- Test results: `/app/test_reports/iteration_3.json` (latest)
- Playwright has issues with external images (ORB blocking in test env)

## Files Reference
- API contracts: `/app/contracts.md`
- Database seeder: `/app/backend/seed_data.py`
- API service: `/app/frontend/src/services/api.js`
