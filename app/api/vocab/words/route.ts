import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const words = await prisma.vocabWord.findMany({
      include: {
        vocabSet: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
      },
      orderBy: [
        { vocabSet: { name: 'asc' } },
        { word: 'asc' },
      ],
    });

    return NextResponse.json(words);
  } catch (error) {
    console.error('Error fetching vocabulary words:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary words' },
      { status: 500 }
    );
  }
}
