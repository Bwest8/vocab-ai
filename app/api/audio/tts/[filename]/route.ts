import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import mime from "mime";

const TTS_CACHE_DIR = process.env.TTS_CACHE_DIR;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename || !filename.endsWith('.mp3')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    if (!TTS_CACHE_DIR) {
      console.error("TTS cache directory is not configured");
      return new NextResponse("TTS cache directory is not configured", { status: 500 });
    }

    // Construct the file path
    const resolvedBaseDir = path.resolve(TTS_CACHE_DIR);
    const filePath = path.join(resolvedBaseDir, filename);

    // Security check: Ensure the resolved path is within TTS_CACHE_DIR
    const resolvedPath = path.resolve(filePath);
    const relativePath = path.relative(resolvedBaseDir, resolvedPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
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
