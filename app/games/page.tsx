"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "../components/PageHeader";
import type { GameMode } from "@/lib/types";
import { GameModeSelector } from "@/app/components/GameModeSelector";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";

const schedule: Array<{ day: string; focus: string; mode: GameMode; description: string }> = [
  { day: "Day 1", focus: "Definition Match", mode: "definition-match", description: "Preview new words and match meanings." },
  { day: "Day 2", focus: "Definition Match", mode: "definition-match", description: "Build confidence with repeat play." },
  { day: "Day 3", focus: "Reverse Mode", mode: "reverse-definition", description: "See the words first and recall definitions." },
  { day: "Day 4", focus: "Fill-in-the-Blank", mode: "fill-in-the-blank", description: "Use context clues in real sentences." },
  { day: "Day 5", focus: "Speed Round", mode: "speed-round", description: "Timed challenge for rapid recall." },
  { day: "Day 6", focus: "Matching Game", mode: "matching", description: "Match words with their definitions." },
];

export default function GamesPage() {
  const router = useRouter();
  const {
    vocabSets,
    selectedSetId,
    errorMessage,
    setState,
    wordsState,
    handleSelectSet,
  } = useGamesSession();

  const progress = useGameProgress(selectedSetId || null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const isLoading = setState === "loading" || wordsState === "loading";

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    router.push(`/games/${mode}`);
  };

  return (
    <>
      <PageHeader
        title="Games Lab"
        vocabSets={vocabSets}
        selectedSetId={selectedSetId}
        onSelectSet={handleSelectSet}
        isLoading={isLoading}
      />
      
      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-6 md:pt-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-base text-rose-600">
            {errorMessage}
          </div>
        )}

                {progress.error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-base text-amber-700">
            {progress.error}
          </div>
        )}

        <section className="space-y-6">
          <div className="text-center">
            <div className="mb-6">
              <p className="text-base md:text-lg uppercase tracking-wide text-indigo-600 font-semibold mb-2">Choose a mode</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Pick your adventure!</h2>
              <p className="text-base md:text-lg text-slate-600 mt-2 max-w-3xl mx-auto">
                Complete three correct answers in each mode to light up the schedule trail and unlock your mastery badge!
              </p>
            </div>

            <GameModeSelector
              selectedMode={selectedMode || "definition-match"}
              modeStats={progress.modeStats}
              onSelect={handleModeSelect}
            />
          </div>
        </section>

        {/* Full-page gameplay now handled at /games/[mode] */}
        </div>
      </div>
    </>
  );
}
