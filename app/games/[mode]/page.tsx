"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import type { GameMode } from "@/lib/types";
import { DefinitionMatchGame, FillInTheBlankGame, ReverseDefinitionGame, SpeedRoundGame, MatchingGame } from "@/app/games/components";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";

export default function GameModePage() {
  const params = useParams();
  const router = useRouter();
  const modeParam = (params?.mode as string) || "definition-match";

  const isValidMode = (
    ["definition-match", "reverse-definition", "fill-in-the-blank", "speed-round", "matching"] as const
  ).includes(modeParam as GameMode);

  const mode: GameMode = isValidMode ? (modeParam as GameMode) : "definition-match";

  const {
    vocabSets,
    selectedSetId,
    selectedSetName,
    weeklyWords,
    reviewWords,
    words,
    errorMessage,
    setState,
    wordsState,
    handleSelectSet,
  } = useGamesSession();

  const progress = useGameProgress(selectedSetId || null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    setGameKey(Math.random());
  }, [mode]);

  useEffect(() => {
    if (!isValidMode) {
      router.replace("/games");
    }
  }, [isValidMode, router]);

  const isLoading = setState === "loading" || wordsState === "loading";

  const modeComponent = useMemo(() => {
    const commonProps = {
      weeklyWords,
      reviewWords,
      allWords: words,
      onResult: progress.registerResult,
      gameKey,
    } as const;

    switch (mode) {
      case "definition-match":
        return <DefinitionMatchGame {...commonProps} />;
      case "reverse-definition":
        return <ReverseDefinitionGame {...commonProps} />;
      case "fill-in-the-blank":
        return <FillInTheBlankGame {...commonProps} />;
      case "speed-round":
        return <SpeedRoundGame {...commonProps} />;
      case "matching":
      default:
        return <MatchingGame {...commonProps} />;
    }
  }, [mode, weeklyWords, reviewWords, words, progress.registerResult, gameKey]);

  const titleMap: Record<GameMode, string> = {
    "definition-match": "Definition Match",
    "reverse-definition": "Reverse Definition",
    "fill-in-the-blank": "Fill in the Blank",
    "speed-round": "Speed Round",
    "matching": "Matching Game",
  };

  return (
    <>
      <PageHeader
        title={titleMap[mode]}
        subtitle={selectedSetName || "Weekly word adventures"}
        description="Play in full-screen for the best iPad experience."
        vocabSets={vocabSets}
        selectedSetId={selectedSetId}
        onSelectSet={handleSelectSet}
        isLoading={isLoading}
      />

      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-4 md:pt-6">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-base text-rose-600">
              {errorMessage}
            </div>
          )}

          {progress.error && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-base text-amber-700">
              {progress.error}
            </div>
          )}

          {/* Game area: fills the page, internal scrolling handled by components */}
          <div className="rounded-3xl border border-white/80 bg-white/90 p-4 md:p-6 shadow-md shadow-indigo-100/70 backdrop-blur-sm">
            {modeComponent}
          </div>
        </div>
      </div>
    </>
  );
}
