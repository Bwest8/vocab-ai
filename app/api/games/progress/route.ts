import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { GameMode } from "@/lib/types";

const DEFAULT_PROFILE_KEY = "default";
const COMPLETION_THRESHOLD = 3;

interface ProgressRequestBody {
  vocabSetId?: string;
  profileKey?: string;
  mode?: GameMode;
  correct?: boolean;
  pointsAwarded?: number;
  timeRemaining?: number;
  wordId?: string;
}

const startOfUtcDay = (date: Date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
};

const diffInUtcDays = (a: Date, b: Date) => {
  const msPerDay = 86_400_000;
  return Math.floor((startOfUtcDay(a).getTime() - startOfUtcDay(b).getTime()) / msPerDay);
};

const sanitizePoints = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed);
};

export async function POST(request: Request) {
  const body = (await request.json()) as ProgressRequestBody;
  const profileKey = body.profileKey && body.profileKey.trim().length > 0
    ? body.profileKey
    : DEFAULT_PROFILE_KEY;

  if (!body.vocabSetId || body.vocabSetId.trim().length === 0) {
    return NextResponse.json({ error: "vocabSetId is required" }, { status: 400 });
  }

  if (!body.mode) {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  const pointsAwarded = sanitizePoints(body.pointsAwarded);
  const isCorrect = Boolean(body.correct);
  const now = new Date();
  const vocabSetId = body.vocabSetId;
  const mode = body.mode;
  const wordId = (body.wordId && body.wordId.trim().length > 0) ? body.wordId : null;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let profile = await tx.gameProfile.findUnique({ where: { profileKey } });

      if (!profile) {
        profile = await tx.gameProfile.create({
          data: {
            profileKey,
          },
        });
      }

      const nextCombo = isCorrect ? profile.currentCombo + 1 : 0;
      const nextBestCombo = Math.max(profile.bestCombo, nextCombo);

      let nextStreak = profile.streak;
      let nextLastPlayedAt = profile.lastPlayedAt;

      if (isCorrect) {
        if (!profile.lastPlayedAt) {
          nextStreak = 1;
        } else {
          const diff = diffInUtcDays(now, profile.lastPlayedAt);
          if (diff === 0) {
            nextStreak = Math.max(1, profile.streak);
          } else if (diff === 1) {
            nextStreak = profile.streak + 1;
          } else if (diff > 1) {
            nextStreak = 1;
          }
        }
        nextLastPlayedAt = now;
      }

      const updatedProfile = await tx.gameProfile.update({
        where: { id: profile.id },
        data: {
          points: { increment: pointsAwarded },
          questionsAttempted: { increment: 1 },
          questionsCorrect: isCorrect ? { increment: 1 } : undefined,
          currentCombo: nextCombo,
          bestCombo: nextBestCombo,
          streak: nextStreak,
          lastPlayedAt: nextLastPlayedAt,
        },
      });

      const progressWhere = {
        profileId_vocabSetId_mode: {
          profileId: profile.id,
          vocabSetId,
          mode,
        },
      } as const;

      const progressUpdateData: Prisma.GameModeProgressUpdateInput = {
        attempted: { increment: 1 },
        lastPlayedAt: now,
      };

      if (isCorrect) {
        progressUpdateData.correct = { increment: 1 };
      }

      let progressRecord = await tx.gameModeProgress.upsert({
        where: progressWhere,
        create: {
          profileId: profile.id,
          vocabSetId,
          mode,
          attempted: 1,
          correct: isCorrect ? 1 : 0,
          lastPlayedAt: now,
          completedAt: isCorrect && 1 >= COMPLETION_THRESHOLD ? now : null,
        },
        update: progressUpdateData,
      });

      if (!progressRecord.completedAt && progressRecord.correct >= COMPLETION_THRESHOLD) {
        progressRecord = await tx.gameModeProgress.update({
          where: { id: progressRecord.id },
          data: {
            completedAt: now,
          },
        });
      }

      // Optionally record a game attempt row (word-level granularity)
      // and update StudyProgress for the word if provided.
      if (wordId) {
        await tx.gameAttempt.create({
          data: {
            profileId: profile.id,
            vocabSetId,
            wordId,
            mode,
            correct: isCorrect,
            pointsAwarded,
            timeRemaining: body.timeRemaining ?? null,
          },
        });

        // Upsert study progress (mirrors /api/progress logic, userId is null by design)
        const existing = await tx.studyProgress.findFirst({ where: { wordId, userId: null } });
        if (!existing) {
          await tx.studyProgress.create({
            data: {
              wordId,
              userId: null,
              correctCount: isCorrect ? 1 : 0,
              incorrectCount: isCorrect ? 0 : 1,
              masteryLevel: isCorrect ? 1 : 0,
              lastStudied: now,
            },
          });
        } else {
          const newMasteryLevel = isCorrect
            ? Math.min(existing.masteryLevel + 1, 5)
            : Math.max(existing.masteryLevel - 1, 0);
          await tx.studyProgress.update({
            where: { id: existing.id },
            data: {
              correctCount: isCorrect ? existing.correctCount + 1 : existing.correctCount,
              incorrectCount: !isCorrect ? existing.incorrectCount + 1 : existing.incorrectCount,
              masteryLevel: newMasteryLevel,
              lastStudied: now,
            },
          });
        }
      }

      const modeProgress = await tx.gameModeProgress.findMany({
        where: {
          profileId: profile.id,
          vocabSetId,
        },
      });

      return {
        profile: updatedProfile,
        modeProgress,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error recording game progress", error);
    return NextResponse.json(
      { error: "Failed to record game progress" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const vocabSetId = searchParams.get("vocabSetId");
  const profileKey = searchParams.get("profileKey") || DEFAULT_PROFILE_KEY;

  if (!vocabSetId || vocabSetId.trim().length === 0) {
    return NextResponse.json({ error: "vocabSetId is required" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const profile = await tx.gameProfile.findUnique({ where: { profileKey } });

      if (!profile) {
        return { message: "No progress found to reset" };
      }

      // Delete all mode progress for this vocab set
      await tx.gameModeProgress.deleteMany({
        where: {
          profileId: profile.id,
          vocabSetId,
        },
      });

      // Optionally reset profile stats, but for now, just remove set-specific progress
      // You could subtract points, etc., but keeping it simple

      return { message: "Weekly practice reset successfully" };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting game progress", error);
    return NextResponse.json(
      { error: "Failed to reset game progress" },
      { status: 500 }
    );
  }
}
