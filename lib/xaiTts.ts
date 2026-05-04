const XAI_TTS_ENDPOINT = "https://api.x.ai/v1/tts";
const DEFAULT_XAI_TTS_VOICE_ID = "ara";
const DEFAULT_XAI_TTS_LANGUAGE = "en";

const SUPPORTED_XAI_TTS_VOICES = new Set(["eve", "ara", "leo", "rex", "sal"]);

export interface XaiTtsOutputFormat {
  codec: "mp3";
  sample_rate: 44100;
  bit_rate: 128000;
}

export interface XaiTtsRequestBody {
  text: string;
  voice_id: string;
  output_format: XaiTtsOutputFormat;
  language: string;
}

export interface GenerateXaiTtsAudioOptions {
  apiKey?: string;
  voiceId?: string | null;
  language?: string;
}

export function normalizeXaiVoiceId(voiceId?: string | null): string {
  const configuredDefault = process.env.XAI_TTS_VOICE_ID?.trim().toLowerCase();
  const defaultVoice = configuredDefault && SUPPORTED_XAI_TTS_VOICES.has(configuredDefault)
    ? configuredDefault
    : DEFAULT_XAI_TTS_VOICE_ID;

  const normalizedVoiceId = voiceId?.trim().toLowerCase();

  if (!normalizedVoiceId || !SUPPORTED_XAI_TTS_VOICES.has(normalizedVoiceId)) {
    return defaultVoice;
  }

  return normalizedVoiceId;
}

export function buildXaiTtsRequestBody(
  text: string,
  options: Pick<GenerateXaiTtsAudioOptions, "voiceId" | "language"> = {}
): XaiTtsRequestBody {
  return {
    text,
    voice_id: normalizeXaiVoiceId(options.voiceId),
    output_format: {
      codec: "mp3",
      sample_rate: 44100,
      bit_rate: 128000,
    },
    language: options.language ?? process.env.XAI_TTS_LANGUAGE ?? DEFAULT_XAI_TTS_LANGUAGE,
  };
}

export async function generateXaiTtsAudio(
  text: string,
  options: GenerateXaiTtsAudioOptions = {}
): Promise<Buffer> {
  const apiKey = options.apiKey ?? process.env.XAI_API_KEY;

  if (!apiKey) {
    throw new Error("XAI_API_KEY environment variable is not set.");
  }

  const response = await fetch(XAI_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildXaiTtsRequestBody(text, options)),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `xAI TTS request failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`
    );
  }

  const audioBytes = await response.arrayBuffer();
  return Buffer.from(audioBytes);
}
