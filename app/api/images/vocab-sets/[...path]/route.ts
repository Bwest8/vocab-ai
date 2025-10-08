import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import mime from 'mime';

// Use custom storage dir from environment variable
const VOCAB_IMAGES_DIR = path.resolve(process.env.VOCAB_IMAGES_DIR!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Join the path segments to create the file path
    const filePath = path.join(VOCAB_IMAGES_DIR, ...pathSegments);

    // Security check: Ensure the resolved path is within VOCAB_IMAGES_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(VOCAB_IMAGES_DIR);
    
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Read the file
    const fileBuffer = await readFile(resolvedPath);
    
    // Determine MIME type
    const mimeType = mime.getType(resolvedPath) || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving vocab image:', error);
    
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
