import { NextResponse } from 'next/server';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vocabSetId } = await params;

    const examples = await prisma.vocabExample.findMany({
      where: {
        word: {
          vocabSetId,
        },
        imageUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (examples.length === 0) {
      return NextResponse.json({ success: true, cleared: 0 });
    }

    await Promise.all(
      examples.map(async (example) => {
        if (!example.imageUrl) return;

        const normalizedPath = example.imageUrl.replace(/^\/+/, '');
        const absolutePath = path.join(process.cwd(), 'public', normalizedPath);

        try {
          await unlink(absolutePath);
        } catch (fileError) {
          if ((fileError as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw fileError;
          }
        }
      })
    );

    await prisma.vocabExample.updateMany({
      where: {
        id: {
          in: examples.map((example) => example.id),
        },
      },
      data: {
        imageUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      cleared: examples.length,
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
