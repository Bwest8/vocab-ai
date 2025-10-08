import { NextResponse } from 'next/server';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';

// Use custom storage dir from environment variable
const VOCAB_IMAGES_DIR = path.resolve(process.env.VOCAB_IMAGES_DIR!);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; exampleId: string }> }
) {
  try {
    const { id: vocabSetId, exampleId } = await params;

    const example = await prisma.vocabExample.findUnique({
      where: { id: exampleId },
      include: {
        word: true,
      },
    });

    if (!example || !example.word) {
      return NextResponse.json({ error: 'Example not found' }, { status: 404 });
    }

    if (example.word.vocabSetId !== vocabSetId) {
      return NextResponse.json(
        { error: 'Example does not belong to the specified set' },
        { status: 403 }
      );
    }

    if (example.imageUrl) {
      // Extract filename from URL (handles both /vocab-sets/... and /api/images/vocab-sets/...)
      const urlPath = example.imageUrl.replace(/^\/api\/images\/vocab-sets\//, '').replace(/^\/vocab-sets\//, '');
      const absolutePath = path.join(VOCAB_IMAGES_DIR, urlPath);

      try {
        await unlink(absolutePath);
      } catch (fileError) {
        if ((fileError as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw fileError;
        }
      }
    }

    await prisma.vocabExample.delete({
      where: { id: exampleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vocab example:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete example',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
