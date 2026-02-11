import { fal } from "@fal-ai/client";
import mime from "mime";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface GenerateExampleImageParams {
  vocabSetId: string;
  vocabSetName: string;
  exampleId: string;
  word: string;
  imageDescription: string;
  aspectRatio?: "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "9:16" | "3:4" | "2:3" | "5:4" | "4:5";
}

export interface GeneratedImageResult {
  publicUrl: string;
  absolutePath: string;
  fileName: string;
  mimeType: string;
}

type SeedreamImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | "auto_2K";

type SeedreamImageOutput = {
  url?: string;
  content_type?: string;
};

type SeedreamTextToImageOutput = {
  images?: SeedreamImageOutput[];
};

const FAL_SEEDREAM_MODEL_ID = "fal-ai/bytedance/seedream/v4.5/text-to-image";

const ASPECT_RATIO_TO_IMAGE_SIZE: Record<NonNullable<GenerateExampleImageParams["aspectRatio"]>, SeedreamImageSize> = {
  "21:9": "landscape_16_9",
  "16:9": "landscape_16_9",
  "4:3": "landscape_4_3",
  "3:2": "landscape_4_3",
  "1:1": "square",
  "9:16": "portrait_16_9",
  "3:4": "portrait_4_3",
  "2:3": "portrait_4_3",
  "5:4": "square_hd",
  "4:5": "portrait_4_3",
};

let falClientConfigured = false;

function resolveImageBasePath(): string {
  const baseDir = process.env.VOCAB_IMAGES_DIR;
  if (!baseDir) {
    throw new Error("Missing VOCAB_IMAGES_DIR environment variable.");
  }
  return path.resolve(baseDir);
}

function configureFalClient(): void {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error("Missing FAL_KEY environment variable.");
  }

  if (!falClientConfigured) {
    fal.config({ credentials: falKey });
    falClientConfigured = true;
  }
}

function sanitizeForFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";
}

function buildPrompt(word: string, imageDescription: string, aspectRatio: NonNullable<GenerateExampleImageParams["aspectRatio"]>): string {
  return `You are an expert illustrator creating vibrant, educational illustrations for students aged 10-12.
Create a single image that clearly depicts this vocabulary word: "${word}".

Scene to illustrate:
"${imageDescription.trim()}"

Style and quality requirements:
- Use a modern, colorful, child-friendly illustrated style.
- Use rich, high-contrast colors and a clear focal point.
- Show clear emotion and dynamic action.
- Include 2-3 contextual background details.
- Keep the composition unambiguous to the word meaning.
- Fit the scene well to a ${aspectRatio} aspect ratio.
- Do not add text in the image unless essential.`;
}

async function callSeedream(prompt: string, imageSize: SeedreamImageSize): Promise<SeedreamTextToImageOutput> {
  const subscribe = fal.subscribe as unknown as (
    endpointId: string,
    options: {
      input: {
        prompt: string;
        image_size?: SeedreamImageSize;
        num_images?: number;
        max_images?: number;
        enable_safety_checker?: boolean;
      };
      logs?: boolean;
    }
  ) => Promise<{ data: SeedreamTextToImageOutput }>;

  const result = await subscribe(FAL_SEEDREAM_MODEL_ID, {
    input: {
      prompt,
      image_size: imageSize,
      num_images: 1,
      max_images: 1,
      enable_safety_checker: true,
    },
  });

  return result.data;
}

export async function generateExampleImage({
  vocabSetName,
  word,
  imageDescription,
  aspectRatio = "16:9",
}: GenerateExampleImageParams): Promise<GeneratedImageResult> {
  if (!imageDescription?.trim()) {
    throw new Error("Image description is required.");
  }

  configureFalClient();

  const seedreamOutput = await callSeedream(
    buildPrompt(word, imageDescription, aspectRatio),
    ASPECT_RATIO_TO_IMAGE_SIZE[aspectRatio]
  );

  const generatedImage = seedreamOutput.images?.find((image) => Boolean(image?.url));
  if (!generatedImage?.url) {
    throw new Error("Seedream did not return any image URL.");
  }

  const imageResponse = await fetch(generatedImage.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from Seedream URL: ${imageResponse.statusText}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const imageMimeType =
    generatedImage.content_type ?? imageResponse.headers.get("content-type") ?? "image/png";
  const extension = mime.getExtension(imageMimeType) ?? "png";

  const imageBasePath = resolveImageBasePath();
  const safeSetName = sanitizeForFileName(vocabSetName);
  const setFolder = path.join(imageBasePath, safeSetName);
  await mkdir(setFolder, { recursive: true });

  const safeWord = sanitizeForFileName(word);
  const existingFiles = await readdir(setFolder).catch(() => []);
  const wordImagePattern = new RegExp(`^${safeWord}-image(\\d+)\\.${extension}$`);
  let maxNumber = 0;

  for (const file of existingFiles) {
    const match = file.match(wordImagePattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNumber = maxNumber + 1;
  const fileName = `${safeWord}-image${nextNumber}.${extension}`;
  const absolutePath = path.join(setFolder, fileName);
  await writeFile(absolutePath, imageBuffer);

  return {
    publicUrl: `/api/images/vocab-sets/${safeSetName}/${fileName}`,
    absolutePath,
    fileName,
    mimeType: imageMimeType,
  };
}
