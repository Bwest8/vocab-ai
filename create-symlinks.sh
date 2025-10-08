#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Creating Storage Symlinks ===${NC}\n"

# Storage paths
TTS_DIR="/Users/brianwest/vocab-ai-storage/audio/tts"
IMAGES_DIR="/Users/brianwest/vocab-ai-storage/vocab-sets"

# Check if custom storage exists
if [ ! -d "$TTS_DIR" ]; then
    echo "Error: $TTS_DIR does not exist"
    exit 1
fi

if [ ! -d "$IMAGES_DIR" ]; then
    echo "Error: $IMAGES_DIR does not exist"
    exit 1
fi

# Backup and remove old public directories if they exist
echo -e "${YELLOW}Backing up and removing old directories...${NC}"

if [ -d "public/audio/tts" ] && [ ! -L "public/audio/tts" ]; then
    echo "  Moving public/audio/tts to public/audio/tts.backup"
    mv public/audio/tts public/audio/tts.backup
fi

if [ -d "public/vocab-sets" ] && [ ! -L "public/vocab-sets" ]; then
    echo "  Moving public/vocab-sets to public/vocab-sets.backup"
    mv public/vocab-sets public/vocab-sets.backup
fi

# Create symlinks
echo -e "${YELLOW}Creating symlinks...${NC}"
ln -s "$TTS_DIR" public/audio/tts
ln -s "$IMAGES_DIR" public/vocab-sets

echo -e "${GREEN}✓ Symlinks created!${NC}"
echo ""
echo "  public/audio/tts → $TTS_DIR"
echo "  public/vocab-sets → $IMAGES_DIR"
echo ""
echo "Verify with:"
echo "  ls -la public/ | grep -E '(tts|vocab-sets)'"
