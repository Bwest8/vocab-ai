import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROFILE_KEY = "default";

export interface WordProgressStats {
  wordId: string;
  word: string;
  definition: string;
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
  totalAttempts: number;
  accuracy: number;
  lastStudied: Date | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vocabSetId = searchParams.get("vocabSetId");
  const profileKey = searchParams.get("profileKey") || DEFAULT_PROFILE_KEY;

  if (!vocabSetId || vocabSetId.trim().length === 0) {
    return NextResponse.json({ error: "vocabSetId is required" }, { status: 400 });
  }

  try {
    // Get the profile
    const profile = await prisma.gameProfile.findUnique({
      where: { profileKey },
    });

    if (!profile) {
      // Return empty stats if no profile exists yet
      const words = await prisma.vocabWord.findMany({
        where: { vocabSetId },
        orderBy: { word: 'asc' },
      });

      const emptyStats: WordProgressStats[] = words.map(word => ({
        wordId: word.id,
        word: word.word,
        definition: word.definition,
        masteryLevel: 0,
        correctCount: 0,
        incorrectCount: 0,
        totalAttempts: 0,
        accuracy: 0,
        lastStudied: null,
      }));

      return NextResponse.json({ words: emptyStats });
    }

    // Get all words in the vocab set with their study progress
    const words = await prisma.vocabWord.findMany({
      where: { vocabSetId },
      include: {
        progress: {
          where: { userId: null }, // Game progress uses null userId
        },
        attempts: {
          where: { profileId: profile.id },
        },
      },
      orderBy: { word: 'asc' },
    });

    const wordStats: WordProgressStats[] = words.map(word => {
      const studyProgress = word.progress[0]; // Should only be one record per word with null userId
      const attempts = word.attempts;

      // Calculate stats from game attempts
      const totalAttempts = attempts.length;
      const correctCount = attempts.filter(a => a.correct).length;
      const incorrectCount = totalAttempts - correctCount;
      const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

      return {
        wordId: word.id,
        word: word.word,
        definition: word.definition,
        masteryLevel: studyProgress?.masteryLevel ?? 0,
        correctCount: studyProgress?.correctCount ?? 0,
        incorrectCount: studyProgress?.incorrectCount ?? 0,
        totalAttempts,
        accuracy: Math.round(accuracy),
        lastStudied: studyProgress?.lastStudied ?? null,
      };
    });

    // Sort by mastery level (lowest first) then by accuracy (lowest first)
    wordStats.sort((a, b) => {
      if (a.masteryLevel !== b.masteryLevel) {
        return a.masteryLevel - b.masteryLevel;
      }
      return a.accuracy - b.accuracy;
    });

    return NextResponse.json({ words: wordStats });
  } catch (error) {
    console.error("Error fetching word progress", error);
    return NextResponse.json(
      { error: "Failed to fetch word progress" },
      { status: 500 }
    );
  }
}
