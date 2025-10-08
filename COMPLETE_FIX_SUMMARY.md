# Complete Fix Summary - Image & Audio API Routes

## Problem Resolved
1. **Production image loading failures** - Images failed to load with "image failed to load" errors when running `npm run start`
2. **Broken DELETE routes** - File deletion routes were using incorrect paths after URL format changes
3. **Incomplete cleanup** - Deleting vocab sets or words didn't clean up image files from disk

## All Changes Made

### 1. New API Routes Created
- **`/app/api/images/vocab-sets/[...path]/route.ts`** - Serves vocab images from custom storage
- **`/app/api/audio/tts/[filename]/route.ts`** - Serves TTS audio files from custom storage

### 2. Updated Image Generation
**File**: `/lib/gemini.ts`
- Removed fallback to `public/vocab-sets`
- Always uses environment variable: `process.env.VOCAB_IMAGES_DIR!`
- Always returns API route URLs: `/api/images/vocab-sets/{setId}/{filename}`

### 3. Updated TTS API
**File**: `/app/api/tts/route.ts`
- Removed fallback to `public/audio/tts`
- Always uses environment variable: `process.env.TTS_CACHE_DIR!`
- Always returns JSON with URL reference: `{ url: "/api/audio/tts/{filename}" }`

### 4. Fixed DELETE Routes (File Cleanup on Disk)

All DELETE routes now:
- Use `VOCAB_IMAGES_DIR` from environment variable (no fallback)
- Extract filename from both old and new URL formats
- Delete image files from disk before deleting database records
- Return count of deleted images

**Files Updated**:
- `/app/api/vocab/[id]/route.ts` - DELETE vocab set + all images
- `/app/api/vocab/[id]/images/route.ts` - DELETE all images for a set
- `/app/api/vocab/[id]/examples/[exampleId]/route.ts` - DELETE example + image
- `/app/api/vocab/[id]/examples/[exampleId]/image/route.ts` - DELETE single image
- `/app/api/vocab/words/[wordId]/route.ts` - DELETE word + all example images

### 5. Frontend TTS Handler
**File**: `/app/study/components/StudyFlashcard.tsx`
- Simplified to only handle JSON responses with URL references
- Removed blob URL handling (no longer needed)

### 6. Database Migration
**Script**: `/scripts/update-image-urls.ts`
- Updated 73 existing image URLs from `/vocab-sets/...` to `/api/images/vocab-sets/...`

## Environment Variables Required

Both variables MUST be set in `.env.local` and production environment:

```bash
VOCAB_IMAGES_DIR=/path/to/storage/vocab-sets
TTS_CACHE_DIR=/path/to/storage/audio/tts
```

**No fallbacks exist** - the app will fail if these are not set.

## URL Formats

### Images
- **Old format**: `/vocab-sets/{setId}/{filename}`
- **New format**: `/api/images/vocab-sets/{setId}/{filename}`
- **DELETE routes handle both** for backward compatibility

### Audio
- **Format**: `/api/audio/tts/{hash}.mp3`
- **Response**: `{ "url": "/api/audio/tts/{hash}.mp3" }`

## Benefits
✅ Works in both development and production (no symlink dependency)  
✅ All file operations now properly clean up from disk  
✅ Simplified code - no more fallback logic  
✅ Environment-driven configuration  
✅ Proper security checks prevent directory traversal  
✅ Optimal caching headers (1 year immutable)  

## Breaking Changes
⚠️ **MUST have environment variables set** - no fallbacks to `public/` directory  
⚠️ **TTS always returns JSON** - frontend must handle URL reference (already updated)  

## Files Modified (Summary)
- 10 API route files updated
- 2 new API routes created
- 1 lib file updated (gemini.ts)
- 1 frontend component updated (StudyFlashcard.tsx)
- 1 migration script created
- 2 documentation files updated

## Testing
```bash
# Rebuild
npm run build

# Start production server
npm run start

# Test image API
curl -I http://localhost:3000/api/images/vocab-sets/{setId}/{filename}.png
# Should return: HTTP 200, Content-Type: image/png

# Test TTS API
curl http://localhost:3000/api/tts?text=hello
# Should return: {"url":"/api/audio/tts/{hash}.mp3"}

# Test in browser
# 1. Go to /study page
# 2. Generate a new image - should load correctly
# 3. Click speaker icon - audio should play
# 4. Delete a vocab set - should remove images from disk
```
