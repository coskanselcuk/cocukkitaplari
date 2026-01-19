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

### Session: January 19, 2026
- ✅ **De-branding completed**: Searched and confirmed no "TRT Çocuk Kitaplık" references exist in source code
- ✅ **Bulk notification delete feature (Option B)**:
  - **User Panel**: Added "Tümünü temizle" (Clear All) button to remove all notifications from user's view
  - **Admin Panel**: Added "Tümünü Sil" (Delete All) button to permanently delete all notifications
  - **Backend**: Added `/api/notifications/clear-all` (user) and `/api/notifications/admin/delete-all` (admin) endpoints
  - **Database**: Uses `notification_cleared` collection to track user-specific cleared notifications

### Previous Sessions

### January 18, 2026 - Trial Expiration Push Notifications & Audio Voice Fix
- **Trial Expiration Notification System**: Automated background task that sends in-app notifications when user's trial is expiring
  - Background task runs every hour to check all users with active trials
  - Sends notifications at 3 key milestones:
    - 3 days remaining: "Deneme Süreniz Bitiyor! ⏰"
    - 1 day remaining: "Son 1 Gün! ⚠️"
    - 0 days (expired): "Deneme Süreniz Bitti 😔"
  - Tracks sent notifications in `sent_trial_notifications` collection to prevent duplicates
  - Auto-updates user's subscription_tier to "free" when trial expires
- **Admin Trial Management APIs**:
  - `GET /api/subscriptions/admin/trial-notifications` - View sent notifications and active trials
  - `POST /api/subscriptions/admin/trigger-trial-check` - Manually trigger trial check (for testing)
  - Enhanced `GET /api/subscriptions/admin/stats` - Now includes trial statistics
- **Audio Invalidation UI Fix**: Fixed the admin panel to properly refresh after voice changes
  - `updatePage` function now re-fetches all pages after update
  - Shows alert "Sayfa güncellendi. Ses yeniden oluşturulmalı" when voice is changed
  - Page list correctly shows "Ses Yok" status after voice change

### January 18, 2026 - Custom Voice Management (Sesler Tab)
- **Voice Management Feature**: New "Sesler" tab in admin panel for managing custom ElevenLabs voices
  - Add voices by providing ElevenLabs Voice ID and custom name
  - Voices are automatically verified against ElevenLabs API
  - Set any voice as default for new pages
  - Edit, delete, and verify voices
  - Instructions for finding ElevenLabs Voice IDs included in UI
- **Backend**: New `/api/voices/*` endpoints for CRUD operations on custom voices
  - `GET /api/voices` - List all custom voices
  - `POST /api/voices` - Add a new voice with ElevenLabs ID
  - `PUT /api/voices/{id}` - Update voice name/description
  - `DELETE /api/voices/{id}` - Delete a voice
  - `POST /api/voices/{id}/verify` - Verify voice exists in ElevenLabs
  - `POST /api/voices/set-default/{id}` - Set default voice
- **Page Voice Selection**: Voice dropdowns now use custom voices from DB
  - Shows voice name, description, and default indicator
  - Falls back to hardcoded Irem if no custom voices added

### January 18, 2026 - Per-Page Voice Selection
- **Voice Selection Feature**: Added ability to use different ElevenLabs voices per page
  - Backend: Added `voiceId` field to Page model
  - Backend: Audio generation now uses page-specific voice if set, otherwise default (Irem)
  - Frontend: Voice selector dropdown in Add Page and Edit Page modals
  - Frontend: Voice indicator badge shown in page list for pages with custom voices
  - API: `/api/tts/voices` returns 22 available ElevenLabs voices
- **How it works**: Each page can have its own voice. Default is "Irem - Audiobook Narrator". When audio is generated/regenerated, it uses the page's assigned voice.

### January 18, 2026 - In-App Notifications System
- **Notification Backend APIs**: Complete CRUD for notifications
  - `GET /api/notifications` - Get user notifications (filtered by audience)
  - `GET /api/notifications/unread-count` - Get badge count
  - `POST /api/notifications/mark-read` - Mark specific notifications as read
  - `POST /api/notifications/mark-all-read` - Mark all as read
  - `POST /api/notifications/admin/create` - Admin: Create new notification
  - `GET /api/notifications/admin/list` - Admin: List all notifications
  - `DELETE /api/notifications/admin/{id}` - Admin: Delete notification
- **Auto-Notifications**: System triggers when:
  - New book is created → "Yeni Kitap! 📚" notification
  - New category is created → "Yeni Kategori! 🎨" notification
  - Trial expiring soon → User-specific reminder
  - Reading achievements → User-specific congratulation
- **Notification Types**: new_book, new_category, subscription, achievement, announcement, trial, reminder
- **Target Audiences**: All users, Free users only, Premium users only
- **Frontend Components**:
  - `NotificationPanel.jsx` - Slide-out panel with real-time notifications
  - `NotificationAdmin.jsx` - CMS tab for creating/managing notifications
  - Updated `Header.jsx` - Dynamic badge count from API
- **Admin Panel Tab**: New "Bildirimler" tab in CMS for notification management

### January 18, 2026 - Free Trial Implementation
- **7-Day Free Trial Feature**: Complete implementation for user acquisition
  - Backend: `/api/subscriptions/start-trial` - Starts trial, marks `trial_used=true`
  - Backend: `/api/subscriptions/trial-status/{user_id}` - Returns trial eligibility and days remaining
  - Trial can only be used once per user (prevents abuse)
  - Trial grants premium access for 7 days without payment
  - Auto-expires after 7 days, reverts user to free tier
- **Updated Subscription Modal UI**:
  - Purple gradient "7 Gün Ücretsiz Dene!" CTA for eligible users
  - Shows "Kredi kartı gerekmez" (No credit card required)
  - Trial users see countdown of days remaining
  - After trial used: Shows "Ücretsiz deneme hakkınızı daha önce kullandınız"
  - Trial users can upgrade to paid plan before trial ends
- **Backend Trial Tracking**:
  - `is_trial`, `trial_used`, `trial_started_at`, `trial_ends_at` fields on user
  - `trial_logs` collection for analytics
  - Subscription status API includes trial info

### January 18, 2026 - Audio Bug Fix, Badge Removal & In-App Purchase Backend
- **Audio Sync Bug Fixed**: Critical fix for book reader audio synchronization
  - Fixed issue where audio played from previous page after pausing, toggling auto-play, and navigating
  - Root cause: `audio.src` was not being cleared on page change
  - Solution: Clear `audio.src = ''` on page change and always verify correct audio URL before playing
- **"Made with Emergent" Badge Removed**: Hidden via CSS for production app
  - Added `#emergent-badge { display: none !important; }` to index.html
- **Subscription Backend Complete**: Full backend API for in-app purchases
  - POST `/api/subscriptions/verify-purchase` - Verify and record purchases
  - GET `/api/subscriptions/status/{user_id}` - Get subscription status
  - POST `/api/subscriptions/restore` - Restore previous purchases
  - POST `/api/subscriptions/cancel/{user_id}` - Mark subscription cancelled
  - GET `/api/subscriptions/history/{user_id}` - Get purchase history
  - POST `/api/subscriptions/webhook/apple` - Apple Server Notifications
  - POST `/api/subscriptions/webhook/google` - Google Play RTDN
  - GET `/api/subscriptions/admin/stats` - Admin subscription statistics
- **IAP Service Enhanced**: Updated `iapService.js` with backend integration
  - Purchase verification syncs with backend
  - User ID tracking for purchase attribution
  - Restore purchases syncs with backend
  - Platform detection (iOS/Android/Web)
- **Subscription Modal Updated**: Better UX with auth integration
  - Shows premium status if already subscribed
  - Requires authentication for purchases
  - Manage subscription button for premium users
  - Better error handling and success messages
- **AuthContext IAP Integration**: User ID syncs with IAP service on login/logout

### January 18, 2026 - App Store Assets & Branding
- **App Icon**: Generated colorful children's book app icon (1024x1024)
  - Magical open book with floating stars design
  - Warm orange/cyan/purple gradient
  - Saved to `/app/frontend/public/app-icons/app-icon-1024.png`
- **Store Listings**: Created complete Turkish content for iOS & Android
  - App descriptions, keywords, promotional text
  - Feature graphics guidance
  - Screenshot requirements documented
  - Saved to `/app/frontend/STORE_LISTING.md`
- **PWA Manifest**: Updated with proper Turkish metadata and icons
- **SEO/Meta Tags**: Added Open Graph, Apple Web App, and description tags

### January 17, 2026 - Capacitor Integration & In-App Purchases
- **Capacitor Setup**: Integrated Capacitor 6 for iOS/Android native app builds
  - Configured `capacitor.config.json` with app settings
  - Added iOS and Android platform support
  - Created splash screen and status bar configuration
- **In-App Purchase Service**: Created `iapService.js` for native subscriptions
  - Monthly subscription: `cocukkitaplari_premium_monthly` (₺29.99)
  - Yearly subscription: `cocukkitaplari_premium_yearly` (₺214.99 - 40% discount)
  - Uses `cordova-plugin-purchase` for Apple StoreKit & Google Play Billing
- **Subscription Modal**: Beautiful new subscription UI with plan selection
  - Benefits list, plan comparison, restore purchases
  - Web fallback message for non-native users
- **Build Documentation**: Created `MOBILE_BUILD_GUIDE.md` with complete instructions
  - iOS setup (Xcode, signing, App Store Connect)
  - Android setup (Android Studio, keystore, Play Console)
  - In-app purchase configuration guide

### January 17, 2026 - New Book Content
- **4 New Books with Stories**: Added pages and TTS audio for newly created books
  - Pırıl ve Sihirli Orman (Free) - Firefly's magical adventure
  - Minik Bulut (Free) - Little cloud learning to make rain
  - Ay Prensesi (Premium) - Moon princess granting wishes
  - Deniz Altı Macerası (Premium) - Underwater ocean adventure
- All 10 books now have 5 pages each with ElevenLabs TTS audio

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
- **Home Page API Integration**: Anasayfa now fetches books from API instead of mock data
  - Book carousels (Öneriler, Yeni Eklenenler, En Çok Okunanlar) use live database
  - Admin panel changes now propagate to home page on close
  - All CRUD operations in admin panel reflect immediately across the app

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

### P0 - Critical (Completed)
- [x] Audio synchronization bug in book reader ✅ FIXED

### P1 - High Priority
- [x] Wire up reading progress API to frontend (sync across devices) ✅
- [x] Add CRUD for categories in admin panel ✅
- [x] Generate audio for newly seeded books ✅ (Book 4 done, others pending)
- [x] Test progress sync ✅
- [x] Backend subscription/purchase verification API ✅ COMPLETED
- [x] IAP service backend integration ✅ COMPLETED

### P2 - Medium Priority
- [ ] Complete native in-app purchase testing (requires App Store Connect & Play Console setup)
- [ ] Apple/Google receipt validation (production keys needed)
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
- [ ] Profile settings page with editable username
- [x] **Free trial period (7-day) for new subscribers** ✅ COMPLETED
- [x] **Trial expiration push notifications** ✅ COMPLETED
- [ ] Offline mode with downloaded books
- [ ] Family sharing (up to 5 profiles)
- [ ] Push notifications for new book releases
- [ ] Reading statistics dashboard for parents
- [ ] Achievement badges for reading milestones
- [ ] Bedtime reminder notifications
- [ ] Multiple language support (English, German for expat families)
- [ ] Social sharing of completed books
- [ ] Personalized book recommendations based on reading history
- [ ] Audio speed control (0.5x, 1x, 1.5x, 2x)
- [ ] Night mode / dark theme for bedtime reading
- [ ] Parental dashboard with reading reports

## Testing Notes
- Backend tests: `/app/tests/test_backend_api.py`, `/app/tests/test_upload_api.py`
- Test results: `/app/test_reports/iteration_3.json` (latest)
- Playwright has issues with external images (ORB blocking in test env)

## Files Reference
- API contracts: `/app/contracts.md`
- Database seeder: `/app/backend/seed_data.py`
- API service: `/app/frontend/src/services/api.js`
