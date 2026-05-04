import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { generateXaiTtsAudio, normalizeXaiVoiceId } from "@/lib/xaiTts";

const CACHE_DIR_ENV = process.env.TTS_CACHE_DIR;

async function ensureCacheDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Generate a hash for the text + voice combination
function generateCacheKey(text: string, voiceId: string): string {
  const hash = crypto.createHash('md5');
  hash.update(`${text}:${voiceId}`);
  return hash.digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const requestedVoiceId = searchParams.get('voiceId');
    const voiceId = normalizeXaiVoiceId(requestedVoiceId);

    if (!text) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    if (!CACHE_DIR_ENV) {
      console.error("TTS cache directory is not configured");
      return NextResponse.json({ error: "TTS cache directory is not configured" }, { status: 500 });
    }

    const cacheDir = path.resolve(CACHE_DIR_ENV);

    await ensureCacheDir(cacheDir);

    // Generate cache key and filename
    const cacheKey = generateCacheKey(text, voiceId);
    const filename = `${cacheKey}.mp3`;
  const filePath = path.join(cacheDir, filename);

    // Check if file exists in cache
    try {
    await fs.access(filePath);
      
      // Return URL reference to API route
      const audioUrl = `/api/audio/tts/${filename}`;
      return NextResponse.json({ url: audioUrl });
    } catch {
      // File doesn't exist, generate it
    }

    // Generate audio with xAI TTS
    const buffer = await generateXaiTtsAudio(text, { voiceId });

    // Save to cache
    await fs.writeFile(filePath, buffer);

    // Return URL reference to API route
    const audioUrl = `/api/audio/tts/${filename}`;
    return NextResponse.json({ url: audioUrl });

  } catch (error) {
    unstable_rethrow(error);
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
  }
}