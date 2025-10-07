import { GoogleGenAI, Modality } from '@google/genai';
import { jsonrepair } from 'jsonrepair';
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

  const systemInstruction = `You are an expert instructional designer and creative director for educational content aimed at students in grades 4-6 (ages 10-12). Your task is to transform a list of vocabulary words into a structured JSON object that serves as a complete learning module and a creative brief for an illustrator.

The JSON output must be an object with a single key "WORDS", which is an array.

For each word you identify, you must provide:
- **WORD**: The vocabulary word itself.
- **DEFINITION**: A clear, concise, and student-friendly definition in a single sentence.
- **TEACHER_DEFINITION**: The exact, original definition provided in the input text.
- **PRONUNCIATION**: A simple, phonetic, syllable-based guide (e.g., "im-PER-i-ous").
- **PART_OF_SPEECH**: The word's grammatical function (e.g., noun, verb, adjective).
- **EXAMPLES**: An array of exactly 5 distinct and engaging examples. Each example must include:
    - **sentence**: A relatable and kid-friendly example sentence that clearly uses the word in a natural context for a 10-12 year old (think school, hobbies, friendships, technology, and family).
    - **image_description**: This is a critical creative brief for an illustrator. Do not just suggest a simple idea. Instead, provide a detailed, one-paragraph description of a scene that visually captures the essence of the sentence. Your description must include:
        - **Subject & Focus**: Clearly define the main character(s) or focal point. Describe their appearance, clothing, and expressions.
        - **Action & Emotion**: Detail the specific action taking place and the emotions of the characters involved. Use strong verbs and evocative language.
        - **Setting & Context**: Describe the environment. Is it a messy bedroom, a sunlit park, a futuristic classroom? Include 2-3 key background details that add context and depth.
        - **Visual Style Cue**: End the description with a cue that reinforces the desired mood, such as "The scene should feel energetic and chaotic," or "The lighting should be warm and comforting."

Your entire output must be a valid JSON object. Parse ALL vocabulary words from the user's input and structure them perfectly within the "WORDS" array. No additional commentary, explanations, or text outside the JSON object is allowed.`;

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

  const normalizedJson = extractJsonPayload(jsonText);
  const parsedJson = parseJsonWithRepair(normalizedJson, jsonText);
  const normalizedResponse = normalizeGeminiResponse(parsedJson);

  // Validate the AI's output against our Zod schema
  const validationResult = VocabWordSchema.safeParse(normalizedResponse);

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
 const systemInstruction = `You are an expert illustrator creating engaging and educational visuals for upper elementary students (ages 10-12). Your primary goal is to create an image that clearly illustrates the meaning of a specific vocabulary word in a memorable and easy-to-understand way.

  Art style guidelines:
  - Use a modern, vibrant illustrated style that is appealing to children.
  - Employ rich, saturated colors with strong contrast to make the image eye-catching.
  - Ensure clean, professional composition with a clear focal point that draws attention to the core concept.
  - The style should be reminiscent of high-quality, contemporary middle-grade book illustrations.
  
  Visual and Educational Requirements:
  - Characters should display clear emotions through expressive facial features and dynamic body language.
  - Settings should be relatable and contain contextual details that enrich the scene.
  - **Crucially, the illustration must visually define the provided vocabulary word.** The scene should be a direct and unambiguous representation of the word's meaning.
  - Compose the scene to effectively fill the requested aspect ratio, avoiding awkward cropping or empty space.`;
  
  
  // The user prompt provides the specific scene and word for this single generation.
  const userPrompt = `Create an illustration: "${imageDescription.trim()}"`;
  
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

function extractJsonPayload(text: string): string {
  const trimmed = text.trim();

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch) {
    return codeFenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  throw new Error('Unable to locate JSON object in AI response.');
}

function parseJsonWithRepair(jsonCandidate: string, rawResponse: string) {
  try {
    return JSON.parse(jsonCandidate);
  } catch (error) {
    // Try cleaning non-ASCII characters which may be hallucinations
    const cleaned = jsonCandidate.replace(/[^\x00-\x7F]/g, '');
    try {
      return JSON.parse(cleaned);
    } catch (cleanError) {
      try {
        const repaired = jsonrepair(cleaned);
        return JSON.parse(repaired);
      } catch (repairError) {
        console.error('Failed to parse AI JSON response', {
          originalError: error,
          cleanError,
          repairError,
          jsonCandidate,
          cleaned,
          rawResponse,
        });

        throw new Error('AI returned malformed JSON that could not be parsed.');
      }
    }
  }
}

function normalizeGeminiResponse(parsed: unknown): { WORDS: GeminiVocabResponse[] } {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI returned data in an unexpected format: missing root object.');
  }

  const root = parsed as Record<string, unknown>;
  const rawWords = extractArray(root, ['WORDS', 'words']);

  const normalizedWords = rawWords.map((rawWord, index) => normalizeGeminiWord(rawWord, index));

  return { WORDS: normalizedWords };
}

function normalizeGeminiWord(rawWord: unknown, wordIndex: number): GeminiVocabResponse {
  const record = isRecord(rawWord) ? rawWord : {};
  const fallbackWord = `Word ${wordIndex + 1}`;

  const WORD = coerceToTrimmedString(
    lookupValue(record, ['WORD', 'word', 'term', 'vocab_word'])
  ) ?? fallbackWord;

  const DEFINITION = coerceToTrimmedString(
    lookupValue(record, ['DEFINITION', 'definition', 'student_definition', 'kid_definition'])
  ) ?? `A kid-friendly explanation for "${WORD}".`;

  const TEACHER_DEFINITION = coerceToTrimmedString(
    lookupValue(record, [
      'TEACHER_DEFINITION',
      'teacherDefinition',
      'teacher_definition',
      'original_definition',
      'source_definition',
    ])
  ) ?? DEFINITION;

  const PRONUNCIATION = coerceToTrimmedString(
    lookupValue(record, ['PRONUNCIATION', 'pronunciation', 'phonetic', 'pronounce'])
  ) ?? `${WORD.toLowerCase().split(' ').join('-')}`;

  const PART_OF_SPEECH = coerceToTrimmedString(
    lookupValue(record, ['PART_OF_SPEECH', 'partOfSpeech', 'part_of_speech', 'pos'])
  )?.toLowerCase() ?? 'noun';

  const EXAMPLES = normalizeGeminiExamples(record, WORD);

  return {
    WORD,
    DEFINITION,
    TEACHER_DEFINITION,
    PRONUNCIATION,
    PART_OF_SPEECH,
    EXAMPLES,
  };
}

function normalizeGeminiExamples(
  wordRecord: Record<string, unknown>,
  word: string
): GeminiVocabResponse['EXAMPLES'] {
  const rawExamples = extractArray(lookupValue(wordRecord, ['EXAMPLES', 'examples', 'sample_sentences']));

  const normalized = rawExamples.map((example, index) => normalizeSingleExample(example, word, index));

  const bounded = normalized.slice(0, 5);

  while (bounded.length < 5) {
    bounded.push(createFallbackExample(word, bounded.length));
  }

  return bounded;
}

function normalizeSingleExample(
  rawExample: unknown,
  word: string,
  exampleIndex: number
) {
  const record = isRecord(rawExample) ? rawExample : {};

  const sentenceSource = lookupValue(record, [
    'sentence',
    'Sentence',
    'SENTENCE',
    'example_sentence',
    'exampleSentence',
    'text',
  ]);

  const imageDescriptionSource = lookupValue(record, [
    'image_description',
    'imageDescription',
    'ImageDescription',
    'illustration',
    'illustration_prompt',
    'illustrationPrompt',
    'prompt',
    'imagePrompt',
  ]);

  const sentence = ensureSentence(coerceToTrimmedString(sentenceSource), word, exampleIndex, record);
  const image_description = ensureImageDescription(
    coerceToTrimmedString(imageDescriptionSource),
    word,
    sentence,
    exampleIndex,
    record
  );

  return { sentence, image_description };
}

function ensureSentence(
  candidate: string | null,
  word: string,
  exampleIndex: number,
  rawExample: Record<string, unknown>
): string {
  if (candidate) {
    return candidate;
  }

  console.warn('Gemini example missing sentence; substituting fallback.', {
    word,
    exampleIndex,
    rawExample,
  });

  return createFallbackExample(word, exampleIndex).sentence;
}

function ensureImageDescription(
  candidate: string | null,
  word: string,
  sentence: string,
  exampleIndex: number,
  rawExample: Record<string, unknown>
): string {
  if (candidate) {
    return candidate;
  }

  console.warn('Gemini example missing image description; substituting fallback.', {
    word,
    exampleIndex,
    rawExample,
  });

  return createFallbackExample(word, exampleIndex, sentence).image_description;
}

function createFallbackExample(
  word: string,
  index: number,
  sentenceOverride?: string
): GeminiVocabResponse['EXAMPLES'][number] {
  const names = ['Maya', 'Jordan', 'Sofia', 'Liam', 'Harper'];
  const contexts = [
    'in the science lab',
    'during after-school art club',
    'at soccer practice',
    'during student council meeting',
    'at family game night',
  ];
  const actions = [
    `explains how "${word}" perfectly fits their project idea`,
    `uses the word "${word}" to cheer on a teammate`,
    `writes "${word}" on a poster to describe their plan`,
    `shares a story where "${word}" becomes the key detail`,
    `teaches siblings what "${word}" means`,
  ];
  const settings = [
    `Show a bright classroom with desks pushed together, colorful science posters, and a focused student pointing to a diagram labeled "${word}". Include curious classmates leaning in to listen.`,
    `Depict an art room filled with easels and paint splatters as a confident student explains how "${word}" inspires their mural while friends react with wide smiles.`,
    `Illustrate a sunny soccer field where one player gestures mid-play, using "${word}" to encourage the team while others sprint across the grass.`,
    `Capture a lively school meeting with clipboards, laptops, and posters; one student at the center presents an idea titled "${word}" as peers nod thoughtfully.`,
    `Show a cozy living room with board games, snacks, and siblings laughing while a child proudly defines "${word}" to win the round.`,
  ];
  const moods = [
    'curious and inspiring',
    'vibrant and imaginative',
    'energetic and motivational',
    'focused and collaborative',
    'warm and celebratory',
  ];

  const name = names[index % names.length];
  const context = contexts[index % contexts.length];
  const action = actions[index % actions.length];
  const setting = settings[index % settings.length];
  const mood = moods[index % moods.length];

  const sentence = sentenceOverride ?? `${name} is ${context} and ${action}.`;

  const image_description = `${setting} Highlight the student confidently using the word "${word}" while classmates react. The lighting should feel ${mood}.`;

  return { sentence, image_description };
}

function extractArray(value: unknown, fallbackKeys?: string[]): any[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (fallbackKeys && isRecord(value)) {
    for (const key of fallbackKeys) {
      const nested = value[key];
      if (Array.isArray(nested)) {
        return nested;
      }
    }
  }

  return [];
}

function lookupValue(source: Record<string, unknown>, possibleKeys: string[]): unknown {
  for (const key of possibleKeys) {
    if (key in source) {
      return source[key];
    }
  }

  const normalizedMap = new Map<string, string>();
  for (const existingKey of Object.keys(source)) {
    normalizedMap.set(normalizeKey(existingKey), existingKey);
  }

  for (const key of possibleKeys) {
    const normalized = normalizeKey(key);
    const actualKey = normalizedMap.get(normalized);
    if (actualKey && actualKey in source) {
      return source[actualKey];
    }
  }

  return undefined;
}

function normalizeKey(key: string): string {
  return key.replace(/[_\s-]/g, '').toLowerCase();
}

function coerceToTrimmedString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const joined = value.map(coerceToTrimmedString).filter(Boolean).join(' ');
    return joined.length > 0 ? joined : null;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parseVocabText(rawText: string): string {
  return rawText.trim();
}