import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GameMode } from "@/lib/games/types";

const DEFAULT_PROFILE_KEY = "default";
const COMPLETION_THRESHOLD = 3;

interface ProgressRequestBody {
  vocabSetId?: string;
  profileKey?: string;
  mode?: GameMode;
  correct?: boolean;
  pointsAwarded?: number;
  timeRemaining?: number;
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

  try {
    const result = await prisma.$transaction(async (tx) => {
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

      let progressRecord = await tx.gameModeProgress.findUnique({
        where: {
          profileId_vocabSetId_mode: {
            profileId: profile.id,
            vocabSetId,
            mode,
          },
        },
      });

      if (!progressRecord) {
        const initialCorrect = isCorrect ? 1 : 0;
        progressRecord = await tx.gameModeProgress.create({
          data: {
            profileId: profile.id,
            vocabSetId,
            mode,
            attempted: 1,
            correct: initialCorrect,
            lastPlayedAt: now,
            completedAt: initialCorrect >= COMPLETION_THRESHOLD ? now : null,
          },
        });
      } else {
        const nextAttempted = progressRecord.attempted + 1;
        const nextCorrect = progressRecord.correct + (isCorrect ? 1 : 0);
        const completedAt = progressRecord.completedAt ?? (isCorrect && nextCorrect >= COMPLETION_THRESHOLD ? now : null);

        progressRecord = await tx.gameModeProgress.update({
          where: { id: progressRecord.id },
          data: {
            attempted: nextAttempted,
            correct: nextCorrect,
            lastPlayedAt: now,
            completedAt,
          },
        });
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
