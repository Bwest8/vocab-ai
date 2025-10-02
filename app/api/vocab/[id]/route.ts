import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vocabSet = await prisma.vocabSet.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            progress: true,
            examples: true,
          },
        },
      },
    });

    if (!vocabSet) {
      return NextResponse.json(
        { error: 'Vocabulary set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vocabSet);
  } catch (error) {
    console.error('Error fetching vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary set' },
      { status: 500 }
    );
  }
}
