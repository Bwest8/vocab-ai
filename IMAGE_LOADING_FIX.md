# Image Loading Fix for Production Mode

## Problem
When running `npm run start` (production mode), images failed to load with "image failed to load" errors. This was happening because:

1. **Custom Storage Configuration**: The app uses `VOCAB_IMAGES_DIR` and `TTS_CACHE_DIR` environment variables pointing to the `storage/` directory
2. **Symlink Limitation**: While symlinks were created from `public/vocab-sets` → `storage/vocab-sets`, Next.js production builds don't follow symlinks by default
3. **Static File Serving**: Next.js only serves static files directly from the `public/` directory in production

## Solution
Created API routes to serve files from custom storage locations:

### 1. Image API Route
**File**: `/app/api/images/vocab-sets/[...path]/route.ts`
- Serves vocabulary images from `$VOCAB_IMAGES_DIR` or fallback to `public/vocab-sets`
- Implements path security checks to prevent directory traversal
- Returns proper MIME types and cache headers (1 year immutable)
- Handles all image formats (png, jpg, webp, etc.)

### 2. Audio API Route
**File**: `/app/api/audio/tts/[filename]/route.ts`
- Serves TTS audio files from `$TTS_CACHE_DIR` or fallback to `public/audio/tts`
- Security checks to prevent unauthorized file access
- Returns audio/mpeg content type with long cache duration

### 3. Updated Image Generation
**File**: `/lib/gemini.ts`
- Modified `generateExampleImage()` to return API route URLs when custom storage is configured
- Format: `/api/images/vocab-sets/{setId}/{filename}` (instead of `/vocab-sets/...`)
- Automatically detects `VOCAB_IMAGES_DIR` env var to determine URL format

### 4. Updated TTS API
**File**: `/app/api/tts/route.ts`
- Returns JSON with `{ url: "/api/audio/tts/{filename}" }` when using custom storage
- Maintains backward compatibility by returning audio blob directly when no custom storage

### 5. Frontend TTS Handler
**File**: `/app/study/components/StudyFlashcard.tsx`
- Updated `speak()` function to handle both response types:
  - JSON response with URL reference (new custom storage mode)
  - Direct audio blob (legacy mode for public directory)

### 6. Database Migration
**Script**: `/scripts/update-image-urls.ts`
- Migrated 73 existing image URLs from `/vocab-sets/...` to `/api/images/vocab-sets/...`
- Only affects rows where custom storage is used

## Environment Variables
Both variables are configured in `.env.local`:
```bash
TTS_CACHE_DIR=/Users/brianwest/Projects/vocab-ai/storage/audio/tts
VOCAB_IMAGES_DIR=/Users/brianwest/Projects/vocab-ai/storage/vocab-sets
```

## Testing
After rebuild and restart:
```bash
npm run build
npm run start
```

Test image serving:
```bash
curl -I http://localhost:3000/api/images/vocab-sets/{setId}/{filename}.png
# Should return: HTTP/1.1 200 OK with Content-Type: image/png
```

Test TTS serving:
```bash
curl http://localhost:3000/api/tts?text=hello&voiceId=67oeJmj7jIMsdE6yXPr5
# Should return: {"url":"/api/audio/tts/{hash}.mp3"}
```

## Benefits
1. ✅ Works in both development (`npm run dev`) and production (`npm run start`)
2. ✅ Supports custom storage paths outside the `public/` directory
3. ✅ Backward compatible with direct `public/` directory storage
4. ✅ Proper caching headers for optimal performance
5. ✅ Security checks prevent directory traversal attacks
6. ✅ No need to copy files or create complex symlink workarounds

## Future Considerations
- These API routes add a small overhead compared to direct static file serving
- For very high traffic, consider using a CDN or reverse proxy to serve from storage directly
- The symlinks in `public/` can remain for development mode compatibility
