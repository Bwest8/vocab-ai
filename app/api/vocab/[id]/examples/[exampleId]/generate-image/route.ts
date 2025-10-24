import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { generateExampleImage } from "@/lib/geminiCreateImage";

const VOCAB_IMAGES_DIR_ENV = process.env.VOCAB_IMAGES_DIR;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; exampleId: string }> }
) {
  try {
    const { id: vocabSetId, exampleId } = await params;

    const example = await prisma.vocabExample.findUnique({
      where: { id: exampleId },
      include: {
        word: {
          include: {
            vocabSet: true,
          },
        },
      },
    });

    if (!example || !example.word) {
      return NextResponse.json({ error: 'Example not found' }, { status: 404 });
    }

    if (example.word.vocabSetId !== vocabSetId) {
      return NextResponse.json({ error: 'Example does not belong to the specified set' }, { status: 403 });
    }

    if (!example.word.vocabSet) {
      return NextResponse.json({ error: 'Vocab set not found' }, { status: 404 });
    }

    if (!example.imageDescription) {
      return NextResponse.json(
        { error: 'Image description is required to generate an illustration for this example.' },
        { status: 400 }
      );
    }

    // Delete old image file if it exists
    if (example.imageUrl) {
      if (!VOCAB_IMAGES_DIR_ENV) {
        console.error("Vocab images directory is not configured");
        return NextResponse.json({ error: "Images directory is not configured" }, { status: 500 });
      }

      const resolvedBaseDir = path.resolve(VOCAB_IMAGES_DIR_ENV);
      const urlPath = example.imageUrl.replace(/^\/api\/images\/vocab-sets\//, '').replace(/^\/vocab-sets\//, '');
      const oldImagePath = path.join(resolvedBaseDir, urlPath);
      
      try {
        await unlink(oldImagePath);
      } catch (err) {
        // File might not exist, that's okay
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`Failed to delete old image ${oldImagePath}:`, err);
        }
      }
    }

    const generated = await generateExampleImage({
      vocabSetId,
      vocabSetName: example.word.vocabSet.name,
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
