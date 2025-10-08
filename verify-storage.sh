#!/bin/bash

# Verification script to check storage migration
# Run this after migration to ensure everything is working

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Storage Verification ===${NC}\n"

# Configuration
STORAGE_BASE="/Users/brianwest/vocab-ai-storage"
TTS_DIR="${STORAGE_BASE}/audio/tts"
IMAGES_DIR="${STORAGE_BASE}/vocab-sets"

# Check if symlinks exist
echo -e "${YELLOW}Checking symlinks...${NC}"
if [ -L "public/audio/tts" ]; then
    echo -e "${GREEN}✓ TTS symlink exists${NC}"
    echo "  Points to: $(readlink public/audio/tts)"
else
    echo -e "${RED}✗ TTS symlink not found${NC}"
fi

if [ -L "public/vocab-sets" ]; then
    echo -e "${GREEN}✓ Images symlink exists${NC}"
    echo "  Points to: $(readlink public/vocab-sets)"
else
    echo -e "${RED}✗ Images symlink not found${NC}"
fi
echo ""

# Check file counts
echo -e "${YELLOW}File counts:${NC}"
TTS_COUNT=$(find "$TTS_DIR" -type f -name "*.mp3" 2>/dev/null | wc -l | tr -d ' ')
IMAGES_COUNT=$(find "$IMAGES_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')

echo "  TTS files: $TTS_COUNT"
echo "  Image files: $IMAGES_COUNT"
echo ""

# Check database references
echo -e "${YELLOW}Checking database references...${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const examples = await prisma.vocabExample.findMany({
    where: { imageUrl: { not: null } },
    select: { imageUrl: true }
  });
  
  console.log(\`  Database has \${examples.length} image references\`);
  
  if (examples.length > 0) {
    const sample = examples[0].imageUrl;
    console.log(\`  Sample path: \${sample}\`);
    
    // Check if file exists
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', sample);
    
    if (fs.existsSync(filePath)) {
      console.log(\`  ✓ Sample file accessible via public path\`);
    } else {
      console.log(\`  ✗ Sample file NOT accessible via public path\`);
    }
  }
  
  await prisma.\$disconnect();
}

verify().catch(console.error);
"
echo ""

# Check env vars
echo -e "${YELLOW}Environment variables:${NC}"
if grep -q "TTS_CACHE_DIR" .env.local 2>/dev/null; then
    echo -e "${GREEN}✓ TTS_CACHE_DIR is set in .env.local${NC}"
else
    echo -e "${YELLOW}⚠ TTS_CACHE_DIR not set in .env.local (using default)${NC}"
fi

if grep -q "VOCAB_IMAGES_DIR" .env.local 2>/dev/null; then
    echo -e "${GREEN}✓ VOCAB_IMAGES_DIR is set in .env.local${NC}"
else
    echo -e "${YELLOW}⚠ VOCAB_IMAGES_DIR not set in .env.local (using default)${NC}"
fi
echo ""

echo -e "${GREEN}=== Verification Complete ===${NC}"
