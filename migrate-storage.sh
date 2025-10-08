#!/bin/bash

# Safe Migration Script for Vocab AI Storage
# This script moves files from public/ to custom storage and creates symlinks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Vocab AI Storage Migration ===${NC}\n"

# Configuration
STORAGE_BASE="/Users/brianwest/vocab-ai-storage"
TTS_DIR="${STORAGE_BASE}/audio/tts"
IMAGES_DIR="${STORAGE_BASE}/vocab-sets"

PUBLIC_TTS="public/audio/tts"
PUBLIC_IMAGES="public/vocab-sets"

# Step 1: Create new storage directories
echo -e "${YELLOW}Step 1: Creating storage directories...${NC}"
mkdir -p "$TTS_DIR"
mkdir -p "$IMAGES_DIR"
echo -e "${GREEN}✓ Directories created${NC}\n"

# Step 2: Count existing files
echo -e "${YELLOW}Step 2: Counting existing files...${NC}"
TTS_COUNT=$(find "$PUBLIC_TTS" -type f -name "*.mp3" 2>/dev/null | wc -l | tr -d ' ')
IMAGES_COUNT=$(find "$PUBLIC_IMAGES" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) 2>/dev/null | wc -l | tr -d ' ')

echo "  TTS files found: $TTS_COUNT"
echo "  Image files found: $IMAGES_COUNT"
echo ""

# Step 3: Backup existing files (optional but recommended)
echo -e "${YELLOW}Step 3: Creating backup...${NC}"
BACKUP_DIR="storage_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ "$TTS_COUNT" -gt 0 ]; then
    cp -r "$PUBLIC_TTS" "$BACKUP_DIR/"
    echo "  ✓ TTS files backed up to $BACKUP_DIR/tts/"
fi

if [ "$IMAGES_COUNT" -gt 0 ]; then
    cp -r "$PUBLIC_IMAGES" "$BACKUP_DIR/"
    echo "  ✓ Image files backed up to $BACKUP_DIR/vocab-sets/"
fi
echo ""

# Step 4: Move TTS files
echo -e "${YELLOW}Step 4: Moving TTS audio files...${NC}"
if [ "$TTS_COUNT" -gt 0 ]; then
    # Move all .mp3 files
    find "$PUBLIC_TTS" -type f -name "*.mp3" -exec cp {} "$TTS_DIR/" \;
    MOVED_TTS=$(find "$TTS_DIR" -type f -name "*.mp3" | wc -l | tr -d ' ')
    echo -e "${GREEN}  ✓ Moved $MOVED_TTS TTS files${NC}"
else
    echo "  No TTS files to move"
fi
echo ""

# Step 5: Move vocab images (preserve directory structure)
echo -e "${YELLOW}Step 5: Moving vocab images...${NC}"
if [ "$IMAGES_COUNT" -gt 0 ]; then
    # Copy entire directory structure
    if [ -d "$PUBLIC_IMAGES" ]; then
        # Find all subdirectories (vocab set IDs)
        for set_dir in "$PUBLIC_IMAGES"/*; do
            if [ -d "$set_dir" ]; then
                set_id=$(basename "$set_dir")
                mkdir -p "$IMAGES_DIR/$set_id"
                cp -r "$set_dir"/* "$IMAGES_DIR/$set_id/" 2>/dev/null || true
                echo "  ✓ Copied set: $set_id"
            fi
        done
        
        MOVED_IMAGES=$(find "$IMAGES_DIR" -type f | wc -l | tr -d ' ')
        echo -e "${GREEN}  ✓ Moved $MOVED_IMAGES image files${NC}"
    fi
else
    echo "  No image files to move"
fi
echo ""

# Step 6: Verify file counts match
echo -e "${YELLOW}Step 6: Verifying migration...${NC}"
NEW_TTS_COUNT=$(find "$TTS_DIR" -type f -name "*.mp3" 2>/dev/null | wc -l | tr -d ' ')
NEW_IMAGES_COUNT=$(find "$IMAGES_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')

echo "  Original TTS count: $TTS_COUNT"
echo "  New TTS count: $NEW_TTS_COUNT"
echo "  Original Images count: $IMAGES_COUNT"
echo "  New Images count: $NEW_IMAGES_COUNT"

if [ "$TTS_COUNT" -eq "$NEW_TTS_COUNT" ] && [ "$IMAGES_COUNT" -eq "$NEW_IMAGES_COUNT" ]; then
    echo -e "${GREEN}  ✓ File counts match!${NC}"
else
    echo -e "${RED}  ✗ Warning: File counts don't match. Check backup before proceeding.${NC}"
    exit 1
fi
echo ""

# Step 7: Remove old directories and create symlinks
echo -e "${YELLOW}Step 7: Creating symlinks...${NC}"
echo "This will delete the old public/ directories and create symlinks."
read -p "Continue? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    # Remove old directories
    rm -rf "$PUBLIC_TTS"
    rm -rf "$PUBLIC_IMAGES"
    
    # Recreate parent directories if needed
    mkdir -p "public/audio"
    mkdir -p "public"
    
    # Create symlinks
    ln -s "$TTS_DIR" "$PUBLIC_TTS"
    ln -s "$IMAGES_DIR" "$PUBLIC_IMAGES"
    
    echo -e "${GREEN}  ✓ Symlinks created${NC}"
    echo "    $PUBLIC_TTS -> $TTS_DIR"
    echo "    $PUBLIC_IMAGES -> $IMAGES_DIR"
else
    echo -e "${YELLOW}  Skipped symlink creation. Files are copied but old directories remain.${NC}"
fi
echo ""

# Step 8: Summary
echo -e "${GREEN}=== Migration Complete ===${NC}"
echo ""
echo "Summary:"
echo "  - TTS files: $NEW_TTS_COUNT files in $TTS_DIR"
echo "  - Images: $NEW_IMAGES_COUNT files in $IMAGES_DIR"
echo "  - Backup: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  1. Add to .env.local:"
echo "     TTS_CACHE_DIR=$TTS_DIR"
echo "     VOCAB_IMAGES_DIR=$IMAGES_DIR"
echo ""
echo "  2. Restart your dev server: npm run dev"
echo ""
echo "  3. Test that images and audio still work"
echo ""
echo "  4. If everything works, you can delete the backup:"
echo "     rm -rf $BACKUP_DIR"
echo ""
