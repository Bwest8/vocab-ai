"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { GameMode } from "@/lib/types";
import { DefinitionMatchGame, FillInTheBlankGame, ReverseDefinitionGame, SpeedRoundGame, MatchingGame, WordScrambleGame } from "@/app/games/components";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";

export default function GameModePage() {
  const params = useParams();
  const router = useRouter();
  const modeParam = (params?.mode as string) || "definition-match";

  const isValidMode = (
    ["definition-match", "reverse-definition", "fill-in-the-blank", "speed-round", "matching", "word-scramble"] as const
  ).includes(modeParam as GameMode);

  const mode: GameMode = isValidMode ? (modeParam as GameMode) : "definition-match";

  const {
    selectedSetId,
    weeklyWords,
    reviewWords,
    words,
    errorMessage,
    setState,
    wordsState,
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
        return <MatchingGame {...commonProps} />;
      case "word-scramble":
        return <WordScrambleGame {...commonProps} />;
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
    "word-scramble": "Word Scramble",
  };

  return (
    <>
      {/* Slim top bar to maximize game area */}
      <div className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center justify-between py-0.5">
            <button
              type="button"
              aria-label="Back to Games"
              onClick={() => router.push("/games")}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              <span className="text-lg">←</span>
              Back to Games
            </button>
            <div className="text-sm font-bold text-slate-800">
              {titleMap[mode]}
            </div>
            <div className="w-[110px]" aria-hidden />
          </div>
        </div>
      </div>

      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-3 pt-1 md:pt-2">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-5 lg:px-6">
          {errorMessage && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {errorMessage}
            </div>
          )}

          {progress.error && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {progress.error}
            </div>
          )}

          {/* Game area: render directly to maximize space */}
          {modeComponent}
        </div>
      </div>
    </>
  );
}