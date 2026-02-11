import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateExampleImage as generateGeminiExampleImage,
  type GenerateExampleImageParams,
} from "@/lib/geminiCreateImage";
import { generateExampleImage as generateFalExampleImage } from "@/lib/falCreateImage";

const SUPPORTED_PROVIDERS = ["gemini", "fal"] as const;
const SUPPORTED_ASPECT_RATIOS = ["21:9", "16:9", "4:3", "3:2", "1:1", "9:16", "3:4", "2:3", "5:4", "4:5"] as const;

type ImageGenerationProvider = (typeof SUPPORTED_PROVIDERS)[number];
type AspectRatio = NonNullable<GenerateExampleImageParams["aspectRatio"]>;

interface GenerateImageRequestBody {
  provider?: string;
  aspectRatio?: string;
}

function normalizeProvider(value?: string | null): ImageGenerationProvider | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "fal" || normalized === "seedream" || normalized === "seedream-4.5" || normalized === "seedream4.5") {
    return "fal";
  }

  if ((SUPPORTED_PROVIDERS as readonly string[]).includes(normalized)) {
    return normalized as ImageGenerationProvider;
  }

  return null;
}

function normalizeAspectRatio(value?: string | null): AspectRatio | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if ((SUPPORTED_ASPECT_RATIOS as readonly string[]).includes(normalized)) {
    return normalized as AspectRatio;
  }

  return null;
}

async function readJsonBody(request: Request): Promise<GenerateImageRequestBody | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  const text = await request.text();
  if (!text.trim()) {
    return null;
  }

  const parsed = JSON.parse(text) as GenerateImageRequestBody;
  return parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; exampleId: string }> }
) {
  try {
    const url = new URL(request.url);
    const body = await readJsonBody(request);
    const { id: vocabSetId, exampleId } = await params;

    const providerInputValue = body?.provider ?? url.searchParams.get("provider");
    const providerFromInput = normalizeProvider(providerInputValue);
    const providerFromEnv = normalizeProvider(process.env.IMAGE_GENERATION_PROVIDER);
    const provider = providerFromInput ?? providerFromEnv ?? "gemini";

    const aspectRatioInputValue = body?.aspectRatio ?? url.searchParams.get("aspectRatio");
    const aspectRatioFromInput = normalizeAspectRatio(aspectRatioInputValue);
    const aspectRatio = aspectRatioFromInput ?? "16:9";

    if (!providerFromInput && providerInputValue) {
      return NextResponse.json(
        {
          error: `Unsupported image provider. Use one of: ${SUPPORTED_PROVIDERS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (!aspectRatioFromInput && aspectRatioInputValue) {
      return NextResponse.json(
        {
          error: `Unsupported aspect ratio. Use one of: ${SUPPORTED_ASPECT_RATIOS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

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

    if (example.imageUrl) {
      return NextResponse.json(
        { error: "This example already has a generated visual. Regeneration is disabled." },
        { status: 409 }
      );
    }

    const imageGenerator =
      provider === "fal" ? generateFalExampleImage : generateGeminiExampleImage;

    const generated = await imageGenerator({
      vocabSetId,
      vocabSetName: example.word.vocabSet.name,
      exampleId,
      word: example.word.word,
      imageDescription: example.imageDescription,
      aspectRatio,
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
      provider,
    });
  } catch (error) {
    console.error('Error generating vocab example image:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON body in image generation request.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate image for the requested example.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
