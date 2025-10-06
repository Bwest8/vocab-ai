import { GoogleGenAI, Modality } from '@google/genai';
import mime from 'mime';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import type { GeminiVocabResponse } from './types';

// =============================================================================
// 1. Model Initialization & Configuration
// =============================================================================

const GEMINI_TEXT_MODEL_ID = 'models/gemini-2.5-flash';
const GEMINI_IMAGE_MODEL_ID = 'models/gemini-2.5-flash-image';
const GEMINI_IMAGE_BASE_PATH = path.join(process.cwd(), 'public', 'vocab-sets');

// Single client for the entire module
let genAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.');
  }

  if (!genAIClient) {
    // Pass the apiKey inside an options object
    genAIClient = new GoogleGenAI({ apiKey });
  }

  return genAIClient;
}

// Zod schema for vocabulary word structure (used for validation)
const VocabWordSchema = z.object({
  WORDS: z.array(
    z.object({
      WORD: z.string(),
      DEFINITION: z.string().describe('A clear, concise, student-friendly definition in one sentence'),
      TEACHER_DEFINITION: z.string().describe('The original definition provided by the teacher in the input text'),
      PRONUNCIATION: z.string().describe('Simple, syllable-based pronunciation guide (e.g., "EN-vuh-lope")'),
      PART_OF_SPEECH: z.string().describe('noun | verb | adjective | adverb | etc.'),
      EXAMPLES: z.array(
        z.object({
          sentence: z.string().describe('Kid-friendly example sentence'),
          image_description: z.string().describe('Child-friendly illustration idea based on this sentence'),
        })
      ).length(5),
    })
  ),
});

// =============================================================================
// 2. AI Generation Functions (Text/Object)
// =============================================================================

/**
 * Process vocabulary words using Gemini with system instructions and JSON output mode.
 * @param rawText Raw vocabulary text in any format.
 * @returns Array of structured objects conforming to GeminiVocabResponse.
 */
export async function processVocabularyWords(rawText: string): Promise<GeminiVocabResponse[]> {
  const client = getGenAIClient();

  const systemInstruction = `You are an experienced middle school teacher creating vocabulary learning materials for students in grades 4-6 (ages 10-12). Your task is to parse a list of vocabulary words and return a structured JSON object.

The JSON output must be an object with a single key "WORDS", which is an array.

For each word you find, provide:
- WORD: the vocabulary word.
- DEFINITION: a clear, one-sentence definition for a 10-12 year old.
- TEACHER_DEFINITION: the exact definition from the input text.
- PRONUNCIATION: a simple, syllable-based guide (e.g., "en-VEL-ope").
- PART_OF_SPEECH: noun, verb, adjective, etc.
- EXAMPLES: exactly 5 distinct, engaging example sentences with corresponding image descriptions for a child-friendly illustration. The examples should be relatable to a 10-12 year old's life (school, hobbies, family, etc.).

Parse ALL vocabulary words from the user's input text and return them in the "WORDS" array. The input may be formatted in various ways—extract and process all words you can identify.`;

  // FIX 1: Use client.models.generateContent
  const result = await client.models.generateContent({
    model: GEMINI_TEXT_MODEL_ID,
    contents: [
        { role: 'user', parts: [{ text: `Here is the list of vocabulary words. Please process them according to my instructions:\n\n${rawText}` }] }
    ],
    config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
    },
  });

  // FIX 2: Check if result.text is defined before parsing
  const jsonText = result.text;

  if (!jsonText) {
      throw new Error("AI returned an empty or undefined JSON response text.");
  }
  
  // TypeScript now knows jsonText is definitely a string
  const parsedJson = JSON.parse(jsonText);
  
  // Validate the AI's output against our Zod schema
  const validationResult = VocabWordSchema.safeParse(parsedJson);

  if (!validationResult.success) {
    console.error("Zod validation failed:", validationResult.error);
    throw new Error("AI returned data in an unexpected format.");
  }

  return validationResult.data.WORDS;
}

// =============================================================================
// 3. AI Generation Functions (Image)
// =============================================================================

export interface GenerateExampleImageParams {
  vocabSetId: string;
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

/**
 * Generates an example illustration for a vocabulary word using system instructions.
 */
export async function generateExampleImage({
  vocabSetId,
  exampleId,
  word,
  imageDescription,
  aspectRatio = '16:9',
}: GenerateExampleImageParams): Promise<GeneratedImageResult> {
  if (!imageDescription?.trim()) {
    throw new Error('Image description is required.');
  }

  const client = getGenAIClient();

  // The system instruction defines the consistent art style.
  const systemInstruction = `You are an expert illustrator creating engaging visuals for upper elementary students (ages 10-12).

Art style guidelines:
- Use a modern, vibrant illustrated style.
- Employ rich, saturated colors with good contrast.
- Ensure clean, professional composition with clear focal points.
- The style should resemble modern middle-grade book illustrations.

Visual requirements:
- Show clear emotions on characters' faces and use dynamic poses.
- Include relatable, contemporary settings and environmental details.
- Compose the scene to effectively fill the requested aspect ratio.`;
  
  // The user prompt provides the specific scene and word for this single generation.
  const userPrompt = `Create Image: "${imageDescription.trim()}"'`;
  
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

  const persistImage = async (buffer: Buffer, mimeType: string | undefined) => {
    const resolvedMimeType = mimeType ?? 'image/png';
    const extension = mime.getExtension(resolvedMimeType) ?? 'png';

    const setFolder = path.join(GEMINI_IMAGE_BASE_PATH, vocabSetId);
    await mkdir(setFolder, { recursive: true });

    const safeWord = sanitizeForFileName(word);
    const fileName = `${safeWord}-${exampleId}-${randomUUID()}.${extension}`;
    const absolutePath = path.join(setFolder, fileName);

    await writeFile(absolutePath, buffer);

    const publicUrl = `/vocab-sets/${vocabSetId}/${fileName}`;

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


// =============================================================================
// 4. Utility Functions (Unchanged)
// =============================================================================

function sanitizeForFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
}

export function parseVocabText(rawText: string): string {
  return rawText.trim();
}