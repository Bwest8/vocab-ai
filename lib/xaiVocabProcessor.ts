import { z } from "zod";
import OpenAI from "openai";

// =============================================================================
// 1) Client Setup
// =============================================================================
const XAI_API_KEY = process.env.XAI_API_KEY;
const GROK_MODEL_ID = process.env.GROK_MODEL_ID ?? "grok-4-fast";

if (!XAI_API_KEY) {
  throw new Error("XAI_API_KEY environment variable is not set.");
}

const client = new OpenAI({
  apiKey: XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// =============================================================================
// 2) Schema Definition (Zod)
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
        .min(5)
        .max(5),
    })
  ),
});

type VocabWordResponse = z.infer<typeof VocabWordSchema>;

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
    "Output must strictly conform to the following JSON schema structure. Respond with valid JSON only—no markdown, no extra text, no explanations.",
    "Ensure all keys match exactly: uppercase for main fields (e.g., WORD, DEFINITION), lowercase with underscores for nested (e.g., sentence, image_description).",
    "The root object must have only 'WORDS' as the key, an array of exactly the processed words.",
    "",
    "JSON Schema:",
    JSON.stringify({
      type: "object",
      properties: {
        WORDS: {
          type: "array",
          items: {
            type: "object",
            properties: {
              WORD: { type: "string" },
              DEFINITION: { type: "string" },
              TEACHER_DEFINITION: { type: "string" },
              PRONUNCIATION: { type: "string" },
              PART_OF_SPEECH: { type: "string" },
              EXAMPLES: {
                type: "array",
                minItems: 5,
                maxItems: 5,
                items: {
                  type: "object",
                  properties: {
                    sentence: { type: "string" },
                    image_description: { type: "string" },
                  },
                  required: ["sentence", "image_description"],
                },
                required: ["sentence", "image_description"],
              },
            },
            required: ["WORD", "DEFINITION", "TEACHER_DEFINITION", "PRONUNCIATION", "PART_OF_SPEECH", "EXAMPLES"],
          },
        },
      },
      required: ["WORDS"],
    }, null, 2),
  ].join("\n");

  const prompt = `Here is the list of vocabulary words to process. Extract each word, its part of speech, and teacher definition, then generate the required content. Output the response in JSON format matching the schema:\n\n${rawText}`;

  const response = await client.chat.completions.create({
    model: GROK_MODEL_ID,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Model returned no text output.");

  // Log for debugging (remove after fixing)
  console.log("Raw AI response:", text);

  // Clean common markdown wrappers
  let cleanedText = text
    .replace(/```(?:json)?\s*/g, '')  // Remove opening ```json
    .replace(/\s*```/g, '')           // Remove closing ```
    .trim();

  if (!cleanedText) throw new Error("Model returned no text output after cleaning.");

  let structured: unknown;
  try {
    structured = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Cleaned text that failed to parse:", cleanedText);
    throw new Error("Model returned invalid JSON.");
  }

  const parsed = VocabWordSchema.safeParse(structured);
  if (!parsed.success) {
    console.error("Zod validation failed:", parsed.error.flatten());
    console.error("Attempted structure:", JSON.stringify(structured, null, 2));
    throw new Error("AI returned data in an unexpected format.");
  }

  return parsed.data.WORDS;
}