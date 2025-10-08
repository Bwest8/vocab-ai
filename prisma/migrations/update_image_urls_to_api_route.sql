-- Migration to update image URLs to use API route when custom storage is configured
-- This script updates existing image URLs from /vocab-sets/... to /api/images/vocab-sets/...
-- Only run this if you're using custom VOCAB_IMAGES_DIR storage

UPDATE vocab_examples
SET "imageUrl" = REPLACE("imageUrl", '/vocab-sets/', '/api/images/vocab-sets/')
WHERE "imageUrl" LIKE '/vocab-sets/%'
  AND "imageUrl" NOT LIKE '/api/images/vocab-sets/%';

-- Verify the update
SELECT id, "imageUrl" FROM vocab_examples WHERE "imageUrl" IS NOT NULL LIMIT 10;
