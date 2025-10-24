import { NextResponse } from 'next/server';
import path from 'node:path';
import { unlink, readdir, rm } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';

// Use custom storage dir from environment variable
const VOCAB_IMAGES_DIR = path.resolve(process.env.VOCAB_IMAGES_DIR!);

function sanitizeForFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vocabSetId } = await params;

    // Get the vocab set to find its name
    const vocabSet = await prisma.vocabSet.findUnique({
      where: { id: vocabSetId },
      select: { name: true },
    });

    if (!vocabSet) {
      return NextResponse.json({ error: 'Vocab set not found' }, { status: 404 });
    }

    // Delete all physical files in the set's directory (using sanitized set name)
    const safeSetName = sanitizeForFileName(vocabSet.name);
    const setImageDir = path.join(VOCAB_IMAGES_DIR, safeSetName);
    let filesDeleted = 0;

    try {
      // Check if directory exists and delete all files in it
      const files = await readdir(setImageDir);
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(setImageDir, file);
          try {
            await unlink(filePath);
            filesDeleted++;
          } catch (err) {
            console.warn(`Failed to delete file ${filePath}:`, err);
          }
        })
      );

      // Try to remove the directory itself (will succeed if empty)
      try {
        await rm(setImageDir, { recursive: true });
      } catch (err) {
        // Directory might not be empty or already deleted, that's okay
        console.warn(`Could not remove directory ${setImageDir}:`, err);
      }
    } catch (dirError) {
      // Directory might not exist, that's okay
      if ((dirError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Error accessing directory ${setImageDir}:`, dirError);
      }
    }

    // Clear imageUrl from database for all examples in this set
    const updateResult = await prisma.vocabExample.updateMany({
      where: {
        word: {
          vocabSetId,
        },
        imageUrl: {
          not: null,
        },
      },
      data: {
        imageUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      cleared: updateResult.count,
      filesDeleted,
    });
  } catch (error) {
    console.error('Error resetting vocab set images:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset set images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
