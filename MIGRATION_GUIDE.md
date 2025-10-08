# Database & Storage Migration Guide

## Overview

This guide walks you through migrating your TTS audio and vocab images to a custom storage location while keeping database paths unchanged.

**Key Insight**: The database stores relative paths (e.g., `/vocab-sets/{setId}/file.png`), so we don't need to update the database at all. We just move files and use symlinks so Next.js can still serve them.

## Why This Works

1. **Database**: Stores `/vocab-sets/abc123/image.png` (relative path)
2. **Next.js**: Looks for files in `public/vocab-sets/abc123/image.png`
3. **Symlink**: `public/vocab-sets` → `/Users/brianwest/vocab-ai-storage/vocab-sets`
4. **Result**: Database paths work unchanged! 🎉

## Pre-Migration Checklist

- [ ] Stop the development server (`Ctrl+C`)
- [ ] Review current file counts (script will show these)
- [ ] Ensure you have enough disk space at the new location
- [ ] Have database backup (optional but recommended)

## Migration Steps

### Step 1: Run the Migration Script

```bash
./migrate-storage.sh
```

The script will:
1. Create new storage directories
2. Count existing files
3. Create a timestamped backup
4. Copy files to new location
5. Verify file counts match
6. Ask for confirmation before creating symlinks
7. Remove old directories and create symlinks

**Important**: When prompted, type `yes` to confirm symlink creation.

### Step 2: Update Environment Variables

Add these lines to your `.env.local`:

```bash
# Custom storage paths (macOS)
TTS_CACHE_DIR=/Users/brianwest/vocab-ai-storage/audio/tts
VOCAB_IMAGES_DIR=/Users/brianwest/vocab-ai-storage/vocab-sets
```

### Step 3: Restart Development Server

```bash
npm run dev
```

### Step 4: Verify Everything Works

```bash
./verify-storage.sh
```

This will check:
- Symlinks are created correctly
- File counts match
- Database references are still valid
- Sample files are accessible

### Step 5: Test in the App

1. Open http://localhost:3000
2. Navigate to Study page
3. Click on a word with an image
4. Verify image displays correctly
5. Click the speaker icon to test TTS audio
6. Generate a new image to test write access

## What Gets Migrated

### TTS Audio Files
- **From**: `public/audio/tts/*.mp3` (35 files)
- **To**: `/Users/brianwest/vocab-ai-storage/audio/tts/*.mp3`
- **Symlink**: `public/audio/tts` → new location

### Vocab Images
- **From**: `public/vocab-sets/{setId}/*.png`
- **To**: `/Users/brianwest/vocab-ai-storage/vocab-sets/{setId}/*.png`
- **Symlink**: `public/vocab-sets` → new location
- **Structure**: Preserves all subdirectories (vocab set IDs)

## Database Impact

**Zero database changes needed!** 

The database stores paths like:
```
/vocab-sets/cmgfw8m440000iemiwvf0s1x5/image.png
```

This is relative to the `public/` directory. With symlinks:
```
public/vocab-sets → /Users/brianwest/vocab-ai-storage/vocab-sets
```

Next.js resolves `public/vocab-sets/...` which follows the symlink to your custom location.

## File Structure After Migration

```
/Users/brianwest/vocab-ai-storage/
├── audio/
│   └── tts/
│       ├── 076cccf15965a67460d6deb3401a8b1c.mp3
│       ├── 13f1b3fbf1a9c24cef55b6cf50213605.mp3
│       └── ... (35 files)
└── vocab-sets/
    ├── cmgfw8m440000iemiwvf0s1x5/
    │   ├── exquisite-abc123.png
    │   └── ...
    └── cmgh9ce1u006dieemhxc8588o/
        └── ...

/Users/brianwest/Projects/vocab-ai/public/
├── audio/
│   └── tts → /Users/brianwest/vocab-ai-storage/audio/tts (symlink)
└── vocab-sets → /Users/brianwest/vocab-ai-storage/vocab-sets (symlink)
```

## Troubleshooting

### Symlinks Not Working

Check if symlinks exist:
```bash
ls -la public/audio/
ls -la public/
```

You should see arrows (→) indicating symlinks.

### Files Not Accessible

Verify permissions:
```bash
chmod -R 755 /Users/brianwest/vocab-ai-storage
```

### Wrong File Counts

The migration script will stop if counts don't match. Check the backup:
```bash
ls -la storage_backup_*/
```

### Database Still Shows Images But They Don't Load

Check that symlinks point to correct locations:
```bash
readlink public/audio/tts
readlink public/vocab-sets
```

Should output:
```
/Users/brianwest/vocab-ai-storage/audio/tts
/Users/brianwest/vocab-ai-storage/vocab-sets
```

### Need to Rollback

If something goes wrong:

```bash
# Remove symlinks
rm public/audio/tts
rm public/vocab-sets

# Restore from backup (replace with your actual backup directory name)
cp -r storage_backup_20251007_*/tts public/audio/
cp -r storage_backup_20251007_*/vocab-sets public/

# Remove env vars from .env.local
# Comment out or delete:
# TTS_CACHE_DIR=...
# VOCAB_IMAGES_DIR=...

# Restart dev server
npm run dev
```

## Performance Notes

- **Symlinks have zero performance overhead** - they're just filesystem pointers
- **No database queries change** - paths remain identical
- **Hot reload works** - Next.js watches symlinked directories
- **Git ignore works** - `.gitignore` patterns apply to symlinked paths

## Cleanup

After verifying everything works for a few days:

```bash
# Delete the backup
rm -rf storage_backup_*
```

## Using External Drive

To use an external drive instead:

1. **Before running migration**, edit `migrate-storage.sh`:
   ```bash
   STORAGE_BASE="/Volumes/ExternalDrive/vocab-ai-storage"
   ```

2. **Ensure drive is always mounted** before starting the app

3. **Add to `.env.local`**:
   ```bash
   TTS_CACHE_DIR=/Volumes/ExternalDrive/vocab-ai-storage/audio/tts
   VOCAB_IMAGES_DIR=/Volumes/ExternalDrive/vocab-ai-storage/vocab-sets
   ```

## FAQ

**Q: Will this work in production?**  
A: Yes! The same symlink approach works in production. Just ensure the storage directory exists and has correct permissions.

**Q: Can I change the storage location later?**  
A: Yes! Just move the files, update symlinks, and update `.env.local`. No database changes needed.

**Q: What about new files?**  
A: New TTS and image files will be saved directly to your custom location (via env vars). The app reads `TTS_CACHE_DIR` and `VOCAB_IMAGES_DIR`.

**Q: Do I need to update .gitignore?**  
A: No! The `.gitignore` already ignores `public/vocab-sets/*` and `public/audio/*`, which applies to symlinked directories too.

**Q: Can I delete the public/ directories after migration?**  
A: No! You need the symlinks in `public/`. They're tiny (just filesystem pointers) and let Next.js serve your files.
