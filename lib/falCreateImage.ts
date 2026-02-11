import { ApiError, ValidationError, fal } from "@fal-ai/client";
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

type FalImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9"
  | "auto_2K";

type FalImageOutput = {
  url?: string;
  content_type?: string;
};

type FalTextToImageOutput = {
  images?: FalImageOutput[];
};

const DEFAULT_FAL_IMAGE_MODEL_ID = "fal-ai/bytedance/seedream/v4.5/text-to-image";
const MAX_QWEN_PROMPT_LENGTH = 780;

const ASPECT_RATIO_TO_IMAGE_SIZE: Record<NonNullable<GenerateExampleImageParams["aspectRatio"]>, FalImageSize> = {
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

function resolveFalImageModelId(): string {
  return process.env.FAL_IMAGE_MODEL_ID?.trim() || DEFAULT_FAL_IMAGE_MODEL_ID;
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

function buildQwenPrompt(
  word: string,
  imageDescription: string,
  aspectRatio: NonNullable<GenerateExampleImageParams["aspectRatio"]>
): string {
  const compactPrompt = `Educational illustration for students age 10-12 of the vocabulary word "${word}".
Scene: ${imageDescription.trim()}
Style: vibrant, child-friendly illustration with strong focal point, expressive characters, dynamic action, and 2-3 contextual background details.
Composition: fit ${aspectRatio} aspect ratio with no text overlay.`;

  if (compactPrompt.length <= MAX_QWEN_PROMPT_LENGTH) {
    return compactPrompt;
  }

  return compactPrompt.slice(0, MAX_QWEN_PROMPT_LENGTH).trimEnd();
}

function buildPromptForModel(
  modelId: string,
  word: string,
  imageDescription: string,
  aspectRatio: NonNullable<GenerateExampleImageParams["aspectRatio"]>
): string {
  if (modelId.includes("qwen-image-max")) {
    return buildQwenPrompt(word, imageDescription, aspectRatio);
  }
  return buildPrompt(word, imageDescription, aspectRatio);
}

function safeStringify(value: unknown): string {
  try {
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function trimForError(value: string, maxLength = 1800): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

function formatFalApiError(error: ApiError<unknown>): string {
  if (error instanceof ValidationError) {
    const fields = error.fieldErrors;
    if (fields.length > 0) {
      return trimForError(safeStringify(fields));
    }
  }

  const body = error.body as { message?: unknown; detail?: unknown } | undefined;
  const bestCandidate = body?.detail ?? body?.message ?? error.message;
  return trimForError(safeStringify(bestCandidate));
}

function buildFalInput(modelId: string, prompt: string, imageSize: FalImageSize) {
  const baseInput = {
    prompt,
    image_size: imageSize,
    num_images: 1,
    enable_safety_checker: true,
  };

  if (modelId.includes("qwen-image-max")) {
    return {
      ...baseInput,
      output_format: "png" as const,
    };
  }

  // Seedream supports multi-image knobs; keep previous behavior there.
  if (modelId.includes("seedream")) {
    return {
      ...baseInput,
      max_images: 1,
    };
  }

  return baseInput;
}

async function callFalImageModel(modelId: string, prompt: string, imageSize: FalImageSize): Promise<FalTextToImageOutput> {
  const subscribe = fal.subscribe as unknown as (
    endpointId: string,
    options: {
      input: Record<string, unknown>;
      logs?: boolean;
    }
  ) => Promise<{ data: FalTextToImageOutput }>;

  try {
    const result = await subscribe(modelId, {
      input: buildFalInput(modelId, prompt, imageSize),
    });

    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      const providerMessage = formatFalApiError(error);

      if (error.status === 401) {
        throw new Error(
          `FAL authentication failed for model "${modelId}". Verify FAL_KEY and confirm your account has access to this model. ${providerMessage}`
        );
      }

      if (error.status === 403) {
        throw new Error(
          `FAL access denied for model "${modelId}". Your key is valid but this model may require additional access. ${providerMessage}`
        );
      }

      throw new Error(`FAL image request failed (${error.status}) for "${modelId}": ${providerMessage}`);
    }

    throw error;
  }
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
  const modelId = resolveFalImageModelId();

  const falOutput = await callFalImageModel(
    modelId,
    buildPromptForModel(modelId, word, imageDescription, aspectRatio),
    ASPECT_RATIO_TO_IMAGE_SIZE[aspectRatio]
  );

  const generatedImage = falOutput.images?.find((image) => Boolean(image?.url));
  if (!generatedImage?.url) {
    throw new Error("FAL model did not return any image URL.");
  }

  const imageResponse = await fetch(generatedImage.url);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image from FAL image URL: ${imageResponse.statusText}`);
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
