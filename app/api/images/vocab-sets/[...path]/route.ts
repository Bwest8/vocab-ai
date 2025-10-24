import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import mime from "mime";

const VOCAB_IMAGES_DIR = process.env.VOCAB_IMAGES_DIR;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    if (!VOCAB_IMAGES_DIR) {
      console.error("Vocab images directory is not configured");
      return new NextResponse("Images directory not configured", { status: 500 });
    }

    // Join the path segments to create the file path
    const resolvedBaseDir = path.resolve(VOCAB_IMAGES_DIR);
    const filePath = path.join(resolvedBaseDir, ...pathSegments);

    // Security check: Ensure the resolved path is within VOCAB_IMAGES_DIR
    const resolvedPath = path.resolve(filePath);
    const relativePath = path.relative(resolvedBaseDir, resolvedPath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
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
