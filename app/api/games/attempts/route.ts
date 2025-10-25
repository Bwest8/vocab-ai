import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROFILE_KEY = "default";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vocabSetId = searchParams.get("setId");
  const profileKey = (searchParams.get("profileKey") || DEFAULT_PROFILE_KEY).trim();
  const minutes = Number(searchParams.get("minutes") || 30);
  const includeIncorrect = (searchParams.get("includeIncorrect") || "true").toLowerCase() !== "false";

  if (!vocabSetId) {
    return NextResponse.json({ error: "setId is required" }, { status: 400 });
  }

  const since = new Date(Date.now() - Math.max(1, minutes) * 60_000);

  try {
    const profile = await prisma.gameProfile.findUnique({ where: { profileKey } });
    if (!profile) {
      return NextResponse.json({ attempts: [] });
    }

    // Prisma model GameAttempt exists; fetch recent attempts for the set
    const attempts = await prisma.gameAttempt.findMany({
      where: {
        profileId: profile.id,
        vocabSetId,
        createdAt: { gte: since },
        ...(includeIncorrect ? {} : { correct: true }),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        wordId: true,
        mode: true,
        correct: true,
        pointsAwarded: true,
        timeRemaining: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error("Error fetching recent attempts", error);
    return NextResponse.json({ error: "Failed to fetch recent attempts" }, { status: 500 });
  }
}
