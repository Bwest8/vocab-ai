import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROFILE_KEY = "default";

type ProfileKey = string | null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vocabSetId = searchParams.get("setId");
  const profileKeyParam: ProfileKey = searchParams.get("profileKey");
  const profileKey = (profileKeyParam && profileKeyParam.trim().length > 0)
    ? profileKeyParam
    : DEFAULT_PROFILE_KEY;

  try {
    let profile = await prisma.gameProfile.findUnique({
      where: { profileKey },
    });

    if (!profile) {
      profile = await prisma.gameProfile.create({
        data: {
          profileKey,
        },
      });
    }

    const modeProgress = await prisma.gameModeProgress.findMany({
      where: {
        profileId: profile.id,
        ...(vocabSetId ? { vocabSetId } : {}),
      },
    });

    return NextResponse.json({
      profile,
      modeProgress,
    });
  } catch (error) {
    console.error("Error fetching game profile", error);
    return NextResponse.json(
      { error: "Failed to fetch game profile" },
      { status: 500 }
    );
  }
}
