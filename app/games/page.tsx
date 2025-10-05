"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import type { GameMode } from "@/lib/types";
import { DefinitionMatchGame, ExampleSentenceGame, FillInTheBlankGame, ReverseDefinitionGame, SpeedRoundGame, SpellingGame } from "@/app/components/GameModes";
import { GameModeSelector } from "@/app/components/GameModeSelector";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";
import Modal from 'react-modal';

const schedule: Array<{ day: string; focus: string; mode: GameMode; description: string }> = [
  { day: "Day 1", focus: "Definition Match", mode: "definition-match", description: "Preview new words and match meanings." },
  { day: "Day 2", focus: "Definition Match", mode: "definition-match", description: "Build confidence with repeat play." },
  { day: "Day 3", focus: "Reverse Mode", mode: "reverse-definition", description: "See the words first and recall definitions." },
  { day: "Day 4", focus: "Fill-in-the-Blank", mode: "fill-in-the-blank", description: "Use context clues in real sentences." },
  { day: "Day 5", focus: "Speed Round", mode: "speed-round", description: "Timed challenge for rapid recall." },
  { day: "Day 6", focus: "Spelling Challenge", mode: "spelling", description: "Practice spelling from definitions." },
  { day: "Day 7", focus: "Context Review", mode: "example-sentence", description: "Review with examples & mastery check." },
];

export default function GamesPage() {
  const {
    vocabSets,
    selectedSetId,
    selectedSetName,
    weeklyWords,
    reviewWords,
    words,
    weeklyMastery,
    errorMessage,
    setState,
    wordsState,
    handleSelectSet,
  } = useGamesSession();

  const progress = useGameProgress(selectedSetId || null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    Modal.setAppElement(document.body);
  }, []);

  const isLoading = setState === "loading" || wordsState === "loading";

  const masteryReady = progress.completedModes.size >= 6;

  const modeComponent = useMemo(() => {
    if (!selectedMode) return null;
    const commonProps = {
      weeklyWords,
      reviewWords,
      allWords: words,
      onResult: progress.registerResult,
      gameKey,
    } as const;

    switch (selectedMode) {
      case "definition-match":
        return <DefinitionMatchGame {...commonProps} />;
      case "reverse-definition":
        return <ReverseDefinitionGame {...commonProps} />;
      case "fill-in-the-blank":
        return <FillInTheBlankGame {...commonProps} />;
      case "speed-round":
        return <SpeedRoundGame {...commonProps} />;
      case "spelling":
        return <SpellingGame {...commonProps} />;
      case "example-sentence":
      default:
        return <ExampleSentenceGame {...commonProps} />;
    }
  }, [weeklyWords, reviewWords, words, progress.registerResult, selectedMode]);

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    setGameKey(Math.random());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMode(null);
  };

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-600">Weekly word adventures</p>
            <h1 className="text-3xl font-bold text-slate-900">Games Lab</h1>
            <p className="mt-2 text-sm text-slate-500">
              Rotate through six playful game modes to master this week&apos;s twelve vocabulary words. Keep your streak alive and collect stars along the way!
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active vocab set</label>
            <select
              value={selectedSetId}
              onChange={(event) => handleSelectSet(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100 sm:min-w-[220px]"
            >
              {vocabSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
            {isLoading && <span className="text-xs text-slate-400">Loading words…</span>}
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {errorMessage}
          </div>
        )}

        {progress.error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {progress.error}
          </div>
        )}

        <section className="space-y-6">
          <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600">Choose a mode</p>
                <h2 className="text-xl font-semibold text-slate-900">Mix and match to keep the week exciting</h2>
              </div>
              <p className="text-xs text-slate-500 sm:text-right">
                Complete three correct answers in each mode to light up the schedule trail.
              </p>
            </div>

            <GameModeSelector
              selectedMode={selectedMode || "definition-match"}
              modeStats={progress.modeStats}
              onSelect={handleModeSelect}
            />
          </div>
        </section>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="modal-content"
          overlayClassName="modal-overlay"
          shouldCloseOnOverlayClick={false}
        >
          <div key={gameKey} className="p-4">
            {modeComponent}
            <button onClick={closeModal} className="absolute top-4 right-4 text-2xl">✕</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
