import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExampleImage } from '@/lib/geminiCreateImage';

export async function POST(
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
      return NextResponse.json({ error: 'Example does not belong to the specified set' }, { status: 403 });
    }

    if (!example.imageDescription) {
      return NextResponse.json(
        { error: 'Image description is required to generate an illustration for this example.' },
        { status: 400 }
      );
    }

    const generated = await generateExampleImage({
      vocabSetId,
      exampleId,
      word: example.word.word,
      imageDescription: example.imageDescription,
    });

    const updatedExample = await prisma.vocabExample.update({
      where: { id: exampleId },
      data: {
        imageUrl: generated.publicUrl,
      },
    });

    return NextResponse.json({
      success: true,
      example: updatedExample,
      image: generated,
    });
  } catch (error) {
    console.error('Error generating vocab example image:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image for the requested example.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
