import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import type { GeminiVocabResponse } from './types';

// =============================================================================
// 1. Model Initialization & Configuration
// =============================================================================

// Initialize Gemini models for text/object generation (using AI SDK)
export const geminiFlash = google('models/gemini-flash-latest');
export const geminiImage = google('gemini-2.5-flash-image');

const GEMINI_IMAGE_MODEL_ID = 'gemini-2.5-flash-image';
const GEMINI_IMAGE_BASE_PATH = path.join(process.cwd(), 'public', 'vocab-sets');

let geminiImageClient: GoogleGenAI | null = null;

function getGeminiImageClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable for Gemini image generation.');
  }

  if (!geminiImageClient) {
    geminiImageClient = new GoogleGenAI({ apiKey });
  }

  return geminiImageClient;
}

function sanitizeForFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';
}

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


// =============================================================================
// 2. AI Generation Functions (Text/Object)
// =============================================================================

/**
 * Process vocabulary words in batch using Gemini AI.
 * This is the primary function for processing vocabulary words.
 * Accepts raw text in ANY format and lets the AI parse and process it.
 * @param rawText Raw vocabulary text in any format (numbered lists, comma-separated, with/without POS, etc.)
 * @returns Array of structured objects conforming to GeminiVocabResponse.
 */
export async function processVocabularyWords(rawText: string): Promise<GeminiVocabResponse[]> {
  const schema = z.object({
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

  const result = await generateObject({
    model: geminiFlash,
    schema,
    prompt: `You are an experienced middle school teacher creating vocabulary learning materials for students in grades 4-6 (ages 10-12).

Here is a list of vocabulary words in various formats. Parse them and process each word:

${rawText}

For each word you find, provide:
- WORD: the vocabulary word (extract it from the input text)
- DEFINITION: a clear, precise definition in one sentence that a 10-12 year old can understand. Use grade-appropriate language but don't oversimplify.
- TEACHER_DEFINITION: the exact definition provided by the teacher in the input text (extract it verbatim)
- PRONUNCIATION: a simple, syllable-based pronunciation guide with capitalized stressed syllables (like "en-VEL-ope" or "FLAW-less-lee")
- PART_OF_SPEECH: noun | verb | adjective | adverb | etc.
- EXAMPLES: exactly 5 distinct, engaging example sentences that demonstrate different contexts and uses of the word

Guidelines for examples:
- Use realistic scenarios that 10-12 year olds experience: school projects, friendships, family activities, hobbies, sports, technology
- Vary the contexts: show the word in different situations
- Keep sentences natural and conversational, as if a peer is speaking
- Each sentence should clearly demonstrate the word's meaning through context
- Avoid overly simplistic or babyish scenarios

Guidelines for image descriptions:
- Create vivid, detailed visual scenes that upper elementary students will find engaging
- Focus on relatable situations: classrooms, playgrounds, homes, sports fields, technology use
- Include specific details about characters, actions, settings, and emotions
- Avoid cartoon-style baby images; aim for illustrated scenes that feel more mature and realistic
- Each image should directly illustrate its paired example sentence
- Make scenes dynamic and interesting with clear storytelling elements

Parse ALL vocabulary words from the input text and return them in the WORDS array. The input may be formatted in various ways (numbered lists, comma-separated, with or without part of speech indicators, etc.) - extract and process all words you can identify.`,
  });

  return result.object.WORDS;
}

// =============================================================================
// 3. AI Generation Functions (Image)
// =============================================================================

/**
 * Generates and persists an example illustration for a vocabulary word.
 * Leverages the gemini-2.5-flash-image model, storing the resulting file under
 * `public/vocab-sets/{setId}/` so it can be served statically by Next.js.
 */

export async function generateExampleImage({
  vocabSetId,
  exampleId,
  word,
  imageDescription,
  aspectRatio = '16:9',
}: GenerateExampleImageParams): Promise<GeneratedImageResult> {
  if (!imageDescription?.trim()) {
    throw new Error('Image description is required to generate an illustration.');
  }

  const client = getGeminiImageClient();

  const enhancedPrompt = enhanceImagePrompt(imageDescription.trim(), word);

  const stream = await client.models.generateContentStream({
    model: GEMINI_IMAGE_MODEL_ID,
    contents: [
      {
        role: 'user',
        parts: [{ text: enhancedPrompt }],
      },
    ],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio,
      },
    },
  });

  const imageParts: Array<{ buffer: Buffer; mimeType: string }> = [];

  for await (const chunk of stream as AsyncIterable<unknown>) {
    const candidates = (chunk as any)?.candidates ?? [];

    for (const candidate of candidates) {
      const parts = candidate?.content?.parts ?? [];

      for (const part of parts) {
        const inlineData = part?.inlineData;
        if (inlineData?.data) {
          const mimeType = inlineData?.mimeType ?? 'image/png';
          imageParts.push({
            buffer: Buffer.from(inlineData.data, 'base64'),
            mimeType,
          });
        }
      }
    }
  }

  if (imageParts.length === 0) {
    throw new Error('Gemini did not return any inline image data.');
  }

  const { buffer, mimeType } = imageParts[0];
  const extension = mime.getExtension(mimeType) ?? 'png';

  const setFolder = path.join(GEMINI_IMAGE_BASE_PATH, vocabSetId);
  await mkdir(setFolder, { recursive: true });

  const safeWord = sanitizeForFileName(word);
  const fileName = `${safeWord}-${exampleId}-${randomUUID()}.${extension}`;
  const absolutePath = path.join(setFolder, fileName);

  await writeFile(absolutePath, buffer);

  const publicUrl = `/vocab-sets/${vocabSetId}/${fileName}`;

  return {
    publicUrl,
    absolutePath,
    fileName,
    mimeType,
  };
}



// =============================================================================
// 4. Utility Functions
// =============================================================================

/**
 * Parse raw vocab text input - just pass it verbatim to AI for parsing.
 * The AI is smart enough to handle any format (numbered lists, comma-separated, with/without POS, etc.)
 * @param rawText The raw text input containing vocabulary words in any format.
 * @returns The raw text - no parsing needed, AI handles it all.
 */
export function parseVocabText(rawText: string): string {
  // Simply return the raw text trimmed - let the AI figure out the format
  return rawText.trim();
}

/**
 * Generate image prompt enhancement by adding style and format constraints for generation.
 * Tailored for grades 4-6 students (ages 10-12).
 * @param basePrompt The core description from the AI model.
 * @param word The word itself, to be included in the image.
 * @returns The final, enhanced image generation prompt string.
 */
export function enhanceImagePrompt(basePrompt: string, word: string): string {
  return `Create a detailed, engaging illustration for upper elementary students (ages 10-12): ${basePrompt}

Art style guidelines:
- Use a modern, vibrant illustrated style (not overly cartoonish or babyish)
- Rich, saturated colors with good contrast and depth
- Clean, professional composition with clear focal points
- Style should feel like modern middle-grade book illustrations or educational graphics
- Include realistic details and textures while maintaining visual clarity

Visual requirements:
- Show clear emotions and expressions on characters' faces
- Include environmental details that add context and interest
- Use dynamic poses and compositions that tell a story
- Ensure the scene is relatable to pre-teens: contemporary settings, realistic scenarios
- Wide landscape format (16:9), compose the scene to fill the horizontal space effectively
- Place key elements across the frame to take advantage of the widescreen format

Text element:
- Display the word "${word.toUpperCase()}" at the bottom center in large, bold, highly readable sans-serif font
- Text should be clearly separated from the illustration (use a subtle banner or semi-transparent background bar)
- Ensure excellent contrast between text and background for easy reading
- Position text to work well with the 16:9 landscape format

The overall feel should be sophisticated enough for 10-12 year olds while remaining educational and engaging.`;
}
