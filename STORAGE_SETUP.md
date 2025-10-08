# Custom Storage Setup (macOS)

This guide explains how to store TTS audio and generated images outside the `public/` directory on your Mac.

## Why Change Storage Location?

- **External Drive**: Store large media files on external SSD/HDD
- **Backup Strategy**: Separate media from code for easier backup management
- **Disk Space**: Keep your project directory lightweight
- **Organization**: Centralized media storage across multiple projects

## Setup Instructions

### 1. Create Storage Directories

```bash
# Example: Store on external drive or custom location
mkdir -p /Users/brianwest/vocab-ai-storage/audio/tts
mkdir -p /Users/brianwest/vocab-ai-storage/vocab-sets

# Or use an external drive:
# mkdir -p /Volumes/ExternalDrive/vocab-ai-storage/audio/tts
# mkdir -p /Volumes/ExternalDrive/vocab-ai-storage/vocab-sets
```

### 2. Update Environment Variables

Add to your `.env.local` file:

```bash
# Custom storage paths (macOS)
TTS_CACHE_DIR=/Users/brianwest/vocab-ai-storage/audio/tts
VOCAB_IMAGES_DIR=/Users/brianwest/vocab-ai-storage/vocab-sets

# Or external drive:
# TTS_CACHE_DIR=/Volumes/ExternalDrive/vocab-ai-storage/audio/tts
# VOCAB_IMAGES_DIR=/Volumes/ExternalDrive/vocab-ai-storage/vocab-sets
```

### 3. Restart Development Server

```bash
npm run dev
```

## How It Works

- **TTS Cache**: Audio files are saved to `$TTS_CACHE_DIR` instead of `public/audio/tts/`
- **Vocab Images**: Generated images go to `$VOCAB_IMAGES_DIR/{setId}/` instead of `public/vocab-sets/{setId}/`
- **Fallback**: If env vars not set, defaults to `public/` directory (original behavior)

## Important Notes

### ⚠️ Public Access Consideration

When using custom storage paths **outside** the `public/` directory:

1. **Files won't be served by Next.js static file server**
2. You'll need to implement custom API routes to serve these files
3. Current implementation assumes files are in `public/` for direct access

### Recommended Setup

**Option A: Keep in Public Directory (Default)**
- Simplest setup, works out of the box
- Files served directly by Next.js
- No additional configuration needed

**Option B: Custom Directory with Symlinks**
```bash
# Create symlinks from public/ to your custom storage
ln -s /Users/brianwest/vocab-ai-storage/audio/tts public/audio/tts
ln -s /Users/brianwest/vocab-ai-storage/vocab-sets public/vocab-sets
```
This keeps URLs working while storing files elsewhere.

**Option C: Custom Directory with API Routes** (Advanced)
- Move storage outside `public/`
- Create custom API routes to serve files
- Requires modifying image/audio serving logic

## Migration from Public Directory

If you already have files in `public/`, move them:

```bash
# Move existing TTS cache
mv public/audio/tts/* /Users/brianwest/vocab-ai-storage/audio/tts/

# Move existing vocab images
mv public/vocab-sets/* /Users/brianwest/vocab-ai-storage/vocab-sets/
```

## Verification

After setup, generate a TTS audio or image and check the storage location:

```bash
# Check TTS cache
ls -la /Users/brianwest/vocab-ai-storage/audio/tts/

# Check vocab images
ls -la /Users/brianwest/vocab-ai-storage/vocab-sets/
```

## Troubleshooting

### Files Not Appearing in App

If using paths outside `public/`, you need symlinks or custom serving logic. See "Option B" above.

### Permission Errors

```bash
# Ensure directories have correct permissions
chmod -R 755 /Users/brianwest/vocab-ai-storage
```

### External Drive Issues

If using an external drive, ensure it's mounted before starting the app:

```bash
# Check if drive is mounted
ls /Volumes/ExternalDrive/

# If not mounted, mount it first
```
