"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import type { GameMode } from "@/lib/types";
import { GameModeSelector } from "@/app/components/GameModeSelector";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";

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
      <Header
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
