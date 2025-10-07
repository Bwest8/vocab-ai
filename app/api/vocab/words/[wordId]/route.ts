import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Delete the word (cascade will handle examples and progress)
    await prisma.vocabWord.delete({
      where: { id: wordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}
