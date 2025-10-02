import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all vocabulary sets
export async function GET() {
  try {
    const vocabSets = await prisma.vocabSet.findMany({
      include: {
        words: {
          select: {
            id: true,
            word: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(vocabSets);
  } catch (error) {
    console.error('Error fetching vocabulary sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary sets' },
      { status: 500 }
    );
  }
}
