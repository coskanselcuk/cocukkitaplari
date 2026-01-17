# Çocuk Kitapları - API Contracts

## Overview
This document defines the API endpoints and database schema for the Çocuk Kitapları children's book application.

## Base URL
- Development: `http://localhost:8001/api`
- Production: `{REACT_APP_BACKEND_URL}/api`

---

## Authentication
Currently no authentication is implemented. Future versions will support:
- JWT-based authentication for parents
- Child profiles linked to parent accounts

---

## Database Schema (MongoDB)

### Collection: `books`
```json
{
  "_id": "ObjectId",
  "title": "string",
  "author": "string",
  "category": "string (category_id)",
  "coverImage": "string (URL)",
  "description": "string",
  "ageGroup": "string (e.g., '4-6')",
  "duration": "string (e.g., '8 dk')",
  "hasAudio": "boolean",
  "isNew": "boolean",
  "rating": "number (0-5)",
  "readCount": "number",
  "totalPages": "number",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Collection: `pages`
```json
{
  "_id": "ObjectId",
  "bookId": "ObjectId (ref: books)",
  "pageNumber": "number",
  "text": "string",
  "image": "string (URL)",
  "audioUrl": "string (optional, cached TTS)",
  "hotspots": [
    {
      "x": "number (percentage)",
      "y": "number (percentage)",
      "size": "number",
      "action": "string"
    }
  ]
}
```

### Collection: `categories`
```json
{
  "_id": "ObjectId",
  "slug": "string (unique)",
  "name": "string",
  "description": "string",
  "icon": "string",
  "color": "string (hex)",
  "gradient": "string (tailwind classes)",
  "islandImage": "string (URL)",
  "sortOrder": "number"
}
```

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "email": "string (unique, optional for child profiles)",
  "name": "string",
  "avatar": "string",
  "avatarColor": "string",
  "isChild": "boolean",
  "parentId": "ObjectId (ref: users, null if parent)",
  "age": "number (for children)",
  "createdAt": "datetime"
}
```

### Collection: `reading_progress`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "bookId": "ObjectId (ref: books)",
  "currentPage": "number",
  "isCompleted": "boolean",
  "completedAt": "datetime (nullable)",
  "lastReadAt": "datetime",
  "totalReadTime": "number (seconds)"
}
```

### Collection: `reading_stats`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "totalBooksRead": "number",
  "totalReadingTime": "number (seconds)",
  "favoriteCategory": "string",
  "weeklyProgress": [
    { "day": "string", "books": "number" }
  ],
  "lastUpdated": "datetime"
}
```

---

## API Endpoints

### Books

#### GET /api/books
Get all books with optional filtering.

**Query Parameters:**
- `category` (string, optional): Filter by category slug
- `ageGroup` (string, optional): Filter by age group
- `limit` (number, optional): Limit results (default: 20)
- `offset` (number, optional): Pagination offset

**Response:**
```json
{
  "books": [
    {
      "id": "string",
      "title": "string",
      "author": "string",
      "category": "string",
      "coverImage": "string",
      "description": "string",
      "ageGroup": "string",
      "duration": "string",
      "hasAudio": true,
      "isNew": false,
      "rating": 4.8,
      "readCount": 1250,
      "totalPages": 24
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

#### GET /api/books/{book_id}
Get a single book by ID.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "author": "string",
  "category": "string",
  "coverImage": "string",
  "description": "string",
  "ageGroup": "string",
  "duration": "string",
  "hasAudio": true,
  "isNew": false,
  "rating": 4.8,
  "readCount": 1250,
  "totalPages": 24
}
```

#### GET /api/books/{book_id}/pages
Get all pages for a book.

**Response:**
```json
{
  "bookId": "string",
  "pages": [
    {
      "pageNumber": 1,
      "text": "string",
      "image": "string",
      "hotspots": []
    }
  ]
}
```

### Categories

#### GET /api/categories
Get all categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "string",
      "slug": "bizim-kahramanlar",
      "name": "Bizim Kahramanlar",
      "description": "Kahramanların maceraları",
      "icon": "hero",
      "color": "#FF6B6B",
      "gradient": "from-red-400 to-orange-400",
      "islandImage": "string"
    }
  ]
}
```

### Reading Progress

#### GET /api/progress/{user_id}
Get reading progress for a user.

**Response:**
```json
{
  "userId": "string",
  "books": [
    {
      "bookId": "string",
      "bookTitle": "string",
      "currentPage": 3,
      "totalPages": 24,
      "isCompleted": false,
      "lastReadAt": "2026-01-17T14:30:00Z"
    }
  ]
}
```

#### POST /api/progress
Save reading progress.

**Request Body:**
```json
{
  "userId": "string",
  "bookId": "string",
  "currentPage": 5
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "bookId": "string",
    "currentPage": 5,
    "lastReadAt": "2026-01-17T14:30:00Z"
  }
}
```

#### POST /api/progress/complete
Mark a book as completed.

**Request Body:**
```json
{
  "userId": "string",
  "bookId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Book marked as completed"
}
```

### TTS (Text-to-Speech) - Existing

#### POST /api/tts/generate
Generate TTS audio for text.

**Request Body:**
```json
{
  "text": "string"
}
```

**Response:**
```json
{
  "audio_url": "data:audio/mpeg;base64,...",
  "text": "string",
  "voice_id": "VhxAIIZM8IRmnl5fyeyk"
}
```

#### GET /api/tts/voices
Get available TTS voices.

**Response:**
```json
{
  "voices": [
    {
      "voice_id": "string",
      "name": "string",
      "category": "string"
    }
  ]
}
```

### User Profiles (Future)

#### GET /api/users/{user_id}
Get user profile.

#### POST /api/users
Create a new user/child profile.

#### GET /api/users/{user_id}/stats
Get reading statistics for a user.

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `SERVER_ERROR`: Internal server error

---

## Rate Limiting
- TTS endpoint: 10 requests per minute per user
- Other endpoints: 100 requests per minute per user
