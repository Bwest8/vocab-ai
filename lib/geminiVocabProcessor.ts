import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";

// =============================================================================
// 1) Client Setup
// =============================================================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL_ID =
  process.env.GEMINI_TEXT_MODEL_ID ?? "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// =============================================================================
// 2) Schema Definition (Zod + Type)
// =============================================================================
const VocabWordSchema = z.object({
  WORDS: z.array(
    z.object({
      WORD: z.string(),
      DEFINITION: z.string(),
      TEACHER_DEFINITION: z.string(),
      PRONUNCIATION: z.string(),
      PART_OF_SPEECH: z.string(),
      EXAMPLES: z
        .array(
          z.object({
            sentence: z.string(),
            image_description: z.string(),
          })
        )
        .length(5),
    })
  ),
});

type VocabWordResponse = z.infer<typeof VocabWordSchema>;

const VocabWordTypeSchema = {
  type: Type.OBJECT,
  properties: {
    WORDS: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          WORD: { type: Type.STRING },
          DEFINITION: { type: Type.STRING },
          TEACHER_DEFINITION: { type: Type.STRING },
          PRONUNCIATION: { type: Type.STRING },
          PART_OF_SPEECH: { type: Type.STRING },
          EXAMPLES: {
            type: Type.ARRAY,
            minItems: 5,
            maxItems: 5,
            items: {
              type: Type.OBJECT,
              properties: {
                sentence: { type: Type.STRING },
                image_description: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  },
} as const;

// =============================================================================
// 3) Generator Function
// =============================================================================
export async function processVocabularyWords(
  rawText: string
): Promise<VocabWordResponse["WORDS"]> {
  const systemInstruction = [
  // Role & context
  "You are an expert instructional designer and educational content creator specializing in literacy development for students in grades 4 through 6.",

  // Core objective
  "Your task is to process each provided vocabulary word and return a well-structured learning module that is accurate, age-appropriate, and engaging.",

  // Required fields
  "For each word, include the following elements:",
  "- A **student-friendly definition** written in clear, simple language that a 10 through 12 year old can easily understand.",
  "- The **teacher-provided definition** (from the input text) preserved as a reference. Clean up any formatting issues, but do not alter the meaning.",
  "- A **pronunciation guide** using easy syllable breakdowns (e.g., EN-vuh-lope).",
  "- The **part of speech** (noun, verb, adjective, etc.).",
  "- Exactly **5 example sentences**, each unique in context, tone, and usage.",

  // Example sentence quality
  "Example sentences must demonstrate real-world, relatable contexts — such as school, hobbies, family, nature, or teamwork — avoiding overly complex or abstract ideas.",

  // Image description requirements
  "Each example must include a **detailed one-paragraph image description** for an illustrator. The description should:",
  "- Clearly describe the **subject** (who or what is in the image).",
  "- Describe the **action** or event taking place.",
  "- Convey the **emotion** or mood of the scene.",
  "- Specify the **setting** (where the scene occurs).",


  // Style & tone
  "Maintain a warm, engaging tone suitable for upper-elementary students.",
  "Definitions and examples should sound natural, conversational, and encouraging — never robotic or overly academic.",

  // Structural fidelity
  "Output must strictly conform to the provided JSON schema structure.",
  "Do not include explanations, notes, or commentary — only structured content conforming to the schema."
];

  const prompt = `Here is the list of vocabulary words:\n\n${rawText}`;

  const response = await client.models.generateContent({
    model: GEMINI_TEXT_MODEL_ID,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: VocabWordTypeSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Model returned no text output.");

  let structured: unknown;
  try {
    structured = JSON.parse(text);
  } catch {
    throw new Error("Model returned invalid JSON.");
  }

  const parsed = VocabWordSchema.safeParse(structured);
  if (!parsed.success) {
    console.error("Zod validation failed:", parsed.error.flatten());
    throw new Error("AI returned data in an unexpected format.");
  }

  return parsed.data.WORDS;
}