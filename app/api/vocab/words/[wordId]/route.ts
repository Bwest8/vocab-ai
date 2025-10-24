import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'node:path';
import { unlink } from 'node:fs/promises';

// Use custom storage dir from environment variable
const VOCAB_IMAGES_DIR = path.resolve(process.env.VOCAB_IMAGES_DIR!);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    const { wordId } = await params;
  const body = await request.json();
  const { word, definition, pronunciation, partOfSpeech, teacherDefinition } = body;

    if (!word || word.trim().length === 0) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    if (!definition || definition.trim().length === 0) {
      return NextResponse.json(
        { error: 'Definition is required' },
        { status: 400 }
      );
    }

    const updatedWord = await prisma.vocabWord.update({
      where: { id: wordId },
      data: {
        word: word.trim(),
        definition: definition.trim(),
        teacherDefinition: teacherDefinition?.trim() || null,
        pronunciation: pronunciation?.trim() || null,
        partOfSpeech: partOfSpeech?.trim() || null,
      },
      include: {
        examples: true,
        vocabSet: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ wordId: string }> }
) {
  try {
    const { wordId } = await params;

    // First, fetch all examples with images that will be deleted
    const examples = await prisma.vocabExample.findMany({
      where: {
        wordId,
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
      examples.map(async (example: { imageUrl: string | null }) => {
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

    // Delete the word (cascade will handle examples and progress in DB)
    await prisma.vocabWord.delete({
      where: { id: wordId },
    });

    return NextResponse.json({ 
      success: true,
      deletedImages: examples.length 
    });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}
