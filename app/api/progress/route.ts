import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wordId, isCorrect, userId = null } = body;

    if (!wordId || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'wordId and isCorrect (boolean) are required' },
        { status: 400 }
      );
    }

    // Check if progress record exists
    const existingProgress = await prisma.studyProgress.findFirst({
      where: {
        wordId,
        userId: userId ?? null,
      },
    });

    let progress;

    if (existingProgress) {
      // Update existing progress
      const newMasteryLevel = isCorrect
        ? Math.min(existingProgress.masteryLevel + 1, 5)
        : Math.max(existingProgress.masteryLevel - 1, 0);

      progress = await prisma.studyProgress.update({
        where: {
          id: existingProgress.id,
        },
        data: {
          correctCount: isCorrect
            ? existingProgress.correctCount + 1
            : existingProgress.correctCount,
          incorrectCount: !isCorrect
            ? existingProgress.incorrectCount + 1
            : existingProgress.incorrectCount,
          masteryLevel: newMasteryLevel,
          lastStudied: new Date(),
        },
      });
    } else {
      // Create new progress record
      progress = await prisma.studyProgress.create({
        data: {
          wordId,
          userId,
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          masteryLevel: isCorrect ? 1 : 0,
          lastStudied: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// GET progress for a specific word or all words
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wordId = searchParams.get('wordId');
    const userId = searchParams.get('userId');

    if (wordId) {
      const progress = await prisma.studyProgress.findFirst({
        where: {
          wordId,
          userId: userId ?? null,
        },
        include: {
          word: true,
        },
      });

      return NextResponse.json(progress);
    }

    // Get all progress records
    const allProgress = await prisma.studyProgress.findMany({
      where: userId ? { userId } : {},
      include: {
        word: {
          include: {
            vocabSet: true,
          },
        },
      },
      orderBy: {
        lastStudied: 'desc',
      },
    });

    return NextResponse.json(allProgress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
