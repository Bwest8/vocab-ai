"use client";

import { useMemo, useState, useEffect } from "react";
import HamburgerMenu from "../components/HamburgerMenu";
import type { GameMode } from "@/lib/types";
import { DefinitionMatchGame, FillInTheBlankGame, ReverseDefinitionGame, SpeedRoundGame } from "@/app/components/GameModes";
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

  const masteryReady = progress.completedModes.size >= 4;

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
      default:
        return <SpeedRoundGame {...commonProps} />;
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
    <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-4 md:pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5">
          <div className="text-center sm:text-left">
            <p className="text-sm md:text-base uppercase tracking-wide text-indigo-600 font-semibold">Weekly word adventures</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">Games Lab</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
              Choose your favorite game mode and master this week&apos;s vocabulary words! Keep your streak alive and collect stars along the way!
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-start gap-2 sm:max-w-sm">
              <label htmlFor="games-vocab-set" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Active vocab set
              </label>
              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <select
                  id="games-vocab-set"
                  value={selectedSetId}
                  onChange={(event) => handleSelectSet(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100 sm:min-w-[240px]"
                >
                  {vocabSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name}
                    </option>
                  ))}
                </select>
                <HamburgerMenu className="sm:ml-3" />
              </div>
              {isLoading && <span className="text-sm text-slate-400">Loading words…</span>}
            </div>
          </div>
        </header>

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

        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="modal-content"
          overlayClassName="modal-overlay"
          shouldCloseOnOverlayClick={false}
        >
          <div key={gameKey} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button 
                  onClick={closeModal} 
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-700 font-semibold text-sm"
                >
                  <span className="text-lg">←</span> Back to Games
                </button>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-600 text-2xl font-bold"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {modeComponent}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
