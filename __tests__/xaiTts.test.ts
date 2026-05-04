import { afterEach, describe, expect, test } from "bun:test";
import {
  buildXaiTtsRequestBody,
  generateXaiTtsAudio,
  normalizeXaiVoiceId,
} from "../lib/xaiTts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("xAI TTS helpers", () => {
  test("builds the xAI TTS request body with Ara MP3 44.1 kHz 128 kbps defaults", () => {
    expect(buildXaiTtsRequestBody("Stun")).toEqual({
      text: "Stun",
      voice_id: "ara",
      output_format: {
        codec: "mp3",
        sample_rate: 44100,
        bit_rate: 128000,
      },
      language: "en",
    });
  });

  test("normalizes supported xAI voice names and falls back when given an old ElevenLabs voice id", () => {
    expect(normalizeXaiVoiceId("EVE")).toBe("eve");
    expect(normalizeXaiVoiceId("67oeJmj7jIMsdE6yXPr5")).toBe("ara");
    expect(normalizeXaiVoiceId(undefined)).toBe("ara");
  });

  test("posts to xAI TTS and returns raw audio bytes", async () => {
    const audioBytes = new Uint8Array([1, 2, 3, 4]);
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = (async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(audioBytes, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      });
    }) as typeof fetch;

    const buffer = await generateXaiTtsAudio("Stun", {
      apiKey: "xai-test-key",
      voiceId: "rex",
    });

    expect(capturedUrl).toBe("https://api.x.ai/v1/tts");
    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.headers).toEqual({
      Authorization: "Bearer xai-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      text: "Stun",
      voice_id: "rex",
      output_format: {
        codec: "mp3",
        sample_rate: 44100,
        bit_rate: 128000,
      },
      language: "en",
    });
    expect([...buffer]).toEqual([1, 2, 3, 4]);
  });
});
