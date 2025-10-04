import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'public', 'audio', 'tts');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
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
    const voiceId = searchParams.get('voiceId') || '21m00Tcm4TlvDq8ikWAM';

    if (!text) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    await ensureCacheDir();

    // Generate cache key and filename
    const cacheKey = generateCacheKey(text, voiceId);
    const filename = `${cacheKey}.mp3`;
    const filePath = path.join(CACHE_DIR, filename);

    // Check if file exists in cache
    try {
      await fs.access(filePath);
      // File exists, return it
      const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(fileBuffer as any, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    } catch {
      // File doesn't exist, generate it
    }

    // Generate audio with ElevenLabs
    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });

    // Convert stream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // Save to cache
    await fs.writeFile(filePath, buffer);

    // Return the audio
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
  }
}