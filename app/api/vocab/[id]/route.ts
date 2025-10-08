import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

// Use custom storage dir from environment variable
const VOCAB_IMAGES_DIR = path.resolve(process.env.VOCAB_IMAGES_DIR!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vocabSet = await prisma.vocabSet.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            progress: true,
            examples: true,
          },
        },
      },
    });

    if (!vocabSet) {
      return NextResponse.json(
        { error: 'Vocabulary set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vocabSet);
  } catch (error) {
    console.error('Error fetching vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary set' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, grade } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedSet = await prisma.vocabSet.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        grade: grade?.trim() || null,
      },
      include: {
        words: {
          include: {
            examples: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error('Error updating vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to update vocabulary set' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, fetch all examples with images that will be deleted
    const examples = await prisma.vocabExample.findMany({
      where: {
        word: {
          vocabSetId: id,
        },
        imageUrl: {
          not: null,
        },
      },
      select: {
        imageUrl: true,
      },
    });

    // Delete image files from disk
    await Promise.all(
      examples.map(async (example) => {
        if (!example.imageUrl) return;

        // Extract filename from URL (handles both /vocab-sets/... and /api/images/vocab-sets/...)
        const urlPath = example.imageUrl
          .replace(/^\/api\/images\/vocab-sets\//, '')
          .replace(/^\/vocab-sets\//, '');
        const absolutePath = path.join(VOCAB_IMAGES_DIR, urlPath);

        try {
          await unlink(absolutePath);
        } catch (fileError) {
          // Log but don't fail if file doesn't exist
          if ((fileError as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(`Failed to delete image file: ${absolutePath}`, fileError);
          }
        }
      })
    );

    // Delete the vocab set (cascade will handle words and examples in DB)
    await prisma.vocabSet.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      deletedImages: examples.length 
    });
  } catch (error) {
    console.error('Error deleting vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to delete vocabulary set' },
      { status: 500 }
    );
  }
}
