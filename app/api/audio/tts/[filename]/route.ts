import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import mime from 'mime';

// Use custom storage dir from environment variable
const TTS_CACHE_DIR = path.resolve(process.env.TTS_CACHE_DIR!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename || !filename.endsWith('.mp3')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    // Construct the file path
    const filePath = path.join(TTS_CACHE_DIR, filename);

    // Security check: Ensure the resolved path is within TTS_CACHE_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(TTS_CACHE_DIR);
    
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Read the file
    const fileBuffer = await readFile(resolvedPath);
    
    // Determine MIME type (should be audio/mpeg for mp3)
    const mimeType = mime.getType(resolvedPath) || 'audio/mpeg';

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving TTS audio:', error);
    
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
