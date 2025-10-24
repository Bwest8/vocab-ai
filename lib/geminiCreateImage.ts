import { GoogleGenAI, Modality } from "@google/genai";
import mime from "mime";
import { mkdir, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

export interface GenerateExampleImageParams {
  vocabSetId: string;
  vocabSetName: string;
  exampleId: string;
  word: string;
  imageDescription: string;
  aspectRatio?: '21:9' | '16:9' | '4:3' | '3:2' | '1:1' | '9:16' | '3:4' | '2:3' | '5:4' | '4:5';
}

export interface GeneratedImageResult {
  publicUrl: string;
  absolutePath: string;
  fileName: string;
  mimeType: string;
}

const GEMINI_IMAGE_MODEL_ID = "models/gemini-2.5-flash-image";

function resolveImageBasePath(): string {
  const baseDir = process.env.VOCAB_IMAGES_DIR;
  if (!baseDir) {
    throw new Error("Missing VOCAB_IMAGES_DIR environment variable.");
  }
  return path.resolve(baseDir);
}

let genAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

function sanitizeForFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
}

export async function generateExampleImage({
  vocabSetName,
  word,
  imageDescription,
  aspectRatio = '16:9',
}: GenerateExampleImageParams): Promise<GeneratedImageResult> {
  if (!imageDescription?.trim()) {
    throw new Error('Image description is required.');
  }

  const client = getGenAIClient();

  const systemInstruction = `You are an expert illustrator creating vibrant, educational illustrations for students aged 10-12. Your goal is to produce an image that clearly and memorably depicts the meaning of a vocabulary word.
  
  Art Style:
  - Use a modern, colorful, child-friendly illustrated style, similar to contemporary middle-grade book illustrations.
  - Apply rich, high-contrast colors for visual appeal.
  - Ensure a clean composition with a clear focal point highlighting the word's meaning.
  - Avoid adding text unless essential.
  
  Requirements:
  - Show clear emotions through expressive characters and dynamic actions.
  - Include relatable settings with 2-3 contextual background details.
  - The illustration must directly and unambiguously represent the vocabulary word's meaning.
  - Fill the requested aspect ratio effectively, avoiding empty or cropped spaces.`;

  const userPrompt = `Illustrate this scene: "${imageDescription.trim()}"`;

  const result = await client.models.generateContent({
    model: GEMINI_IMAGE_MODEL_ID,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseModalities: [Modality.IMAGE],
      imageConfig: { aspectRatio },
    },
  });

  const candidateParts = result.candidates?.[0]?.content?.parts ?? [];

  const imageBasePath = resolveImageBasePath();

  const persistImage = async (buffer: Buffer, mimeType: string | undefined) => {
    const resolvedMimeType = mimeType ?? 'image/png';
    const extension = mime.getExtension(resolvedMimeType) ?? 'png';
    const safeSetName = sanitizeForFileName(vocabSetName);
    const setFolder = path.join(imageBasePath, safeSetName);
    await mkdir(setFolder, { recursive: true });
    
    // Find next available image number for this word
    const safeWord = sanitizeForFileName(word);
    const existingFiles = await readdir(setFolder).catch(() => []);
    const wordImagePattern = new RegExp(`^${safeWord}-image(\\d+)\\.${extension}$`);
    let maxNumber = 0;
    
    for (const file of existingFiles) {
      const match = file.match(wordImagePattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
    
    const nextNumber = maxNumber + 1;
    const fileName = `${safeWord}-image${nextNumber}.${extension}`;
    const absolutePath = path.join(setFolder, fileName);
    await writeFile(absolutePath, buffer);
    const publicUrl = `/api/images/vocab-sets/${safeSetName}/${fileName}`;
    return { publicUrl, absolutePath, fileName, mimeType: resolvedMimeType };
  };

  for (const part of candidateParts) {
    const fileData = (part as { fileData?: { fileUri?: string; mimeType?: string } }).fileData;
    if (fileData?.fileUri) {
      const response = await fetch(fileData.fileUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from Gemini fileUri: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return persistImage(Buffer.from(arrayBuffer), fileData.mimeType);
    }

    const inlineData = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
    if (inlineData?.data) {
      const buffer = Buffer.from(inlineData.data, 'base64');
      return persistImage(buffer, inlineData.mimeType);
    }
  }

  const responseTypes = candidateParts.map((part) =>
    part ? Object.keys(part as Record<string, unknown>).join(', ') : 'unknown'
  );

  throw new Error(
    `Gemini did not return any image data. Parts received: ${responseTypes.join(' | ')}`
  );
}