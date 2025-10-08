# Quick Migration Reference

## TL;DR - Run These Commands

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Run migration
./migrate-storage.sh

# 3. Type 'yes' when prompted for symlinks

# 4. Add to .env.local:
echo "" >> .env.local
echo "# Custom storage paths (macOS)" >> .env.local
echo "TTS_CACHE_DIR=/Users/brianwest/vocab-ai-storage/audio/tts" >> .env.local
echo "VOCAB_IMAGES_DIR=/Users/brianwest/vocab-ai-storage/vocab-sets" >> .env.local

# 5. Restart dev server
npm run dev

# 6. Verify
./verify-storage.sh

# 7. Test in browser
open http://localhost:3000/study
```

## What Happens

- ✅ Files copied to `/Users/brianwest/vocab-ai-storage/`
- ✅ Backup created in `storage_backup_*/`
- ✅ Symlinks created in `public/`
- ✅ Database unchanged (no migration needed!)
- ✅ All existing images/audio continue to work

## Rollback If Needed

```bash
rm public/audio/tts public/vocab-sets
cp -r storage_backup_*/tts public/audio/
cp -r storage_backup_*/vocab-sets public/
# Remove env vars from .env.local
npm run dev
```

## Files Created

- `migrate-storage.sh` - Main migration script
- `verify-storage.sh` - Verification script
- `MIGRATION_GUIDE.md` - Detailed guide (read this first!)
- `QUICK_REFERENCE.md` - This file

## Safety Features

1. **Backup created automatically** before any changes
2. **Verification checks** file counts match
3. **Confirmation required** before creating symlinks
4. **No database changes** - zero risk of data loss
5. **Rollback instructions** included

## Current Status

Run this to check:
```bash
./verify-storage.sh
```
