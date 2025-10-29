"use client";

import { useMemo, useState } from "react";
import Header from "../components/Header";
import type { GameMode } from "@/lib/types";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";
import { useWordProgress } from "@/lib/hooks/useWordProgress";

const MODE_LABELS: Record<GameMode, string> = {
  matching: "Matching",
  "definition-match": "Definition Match",
  "reverse-definition": "Reverse Mode",
  "fill-in-the-blank": "Fill in the Blank",
  "speed-round": "Speed Round",
  "word-scramble": "Word Scramble",
};

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  matching: "Match pairs or images",
  "definition-match": "Match definitions to new words to build familiarity.",
  "reverse-definition": "Show the word first and choose the correct meaning.",
  "fill-in-the-blank": "Use context sentences to select the right word.",
  "speed-round": "Timed review that boosts confidence and recall.",
  "word-scramble": "Unscramble letters to find the correct word.",
};

const MODE_ORDER: GameMode[] = [
  "definition-match",
  "reverse-definition",
  "fill-in-the-blank",
  "speed-round",
  "matching",
  "word-scramble",
];

export default function ParentDashboardPage() {
  const {
    vocabSets,
    selectedSetId,
    selectedSetName,
    handleSelectSet,
  } = useGamesSession();

  const progress = useGameProgress(selectedSetId || null);
  const wordProgress = useWordProgress(selectedSetId || null);
  const [isResetting, setIsResetting] = useState(false);

  const completedModesCount = progress.completedModes.size;

  const completionRate = useMemo(() => {
    if (MODE_ORDER.length === 0) {
      return 0;
    }
    return Math.round((completedModesCount / MODE_ORDER.length) * 100);
  }, [completedModesCount]);

  const getMasteryColor = (masteryLevel: number, accuracy: number) => {
    if (masteryLevel === 0 || accuracy === 0) {
      return {
        bg: "bg-slate-100",
        border: "border-slate-300",
        text: "text-slate-700",
        badge: "bg-slate-400 text-white",
        label: "Not Started"
      };
    }
    if (masteryLevel <= 2 || accuracy < 60) {
      return {
        bg: "bg-rose-50",
        border: "border-rose-300",
        text: "text-rose-900",
        badge: "bg-rose-600 text-white",
        label: "Needs Practice"
      };
    }
    if (masteryLevel <= 3 || accuracy < 80) {
      return {
        bg: "bg-amber-50",
        border: "border-amber-300",
        text: "text-amber-900",
        badge: "bg-amber-600 text-white",
        label: "Developing"
      };
    }
    return {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-900",
      badge: "bg-emerald-600 text-white",
      label: "Mastered"
    };
  };

  const handleResetProgress = async () => {
    if (!selectedSetId || !confirm(`Are you sure you want to reset all weekly practice progress for "${selectedSetName}"? This cannot be undone.`)) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(`/api/games/progress?vocabSetId=${selectedSetId}&profileKey=default`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Weekly practice progress has been reset successfully.');
        // Refresh the progress
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to reset progress: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      alert('An error occurred while resetting progress.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Header
        title="Parent Dashboard"
        vocabSets={vocabSets}
        selectedSetId={selectedSetId}
        onSelectSet={handleSelectSet}
        rightSlot={selectedSetId ? (
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => window.open(`/parent/print-matching/${selectedSetId}`, '_blank')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md transition hover:bg-blue-700"
            >
              🖨️ Print Matching Activity
            </button>
            <button
              onClick={handleResetProgress}
              disabled={isResetting}
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-md transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Resetting...' : '🔄 Reset Progress'}
            </button>
          </div>
        ) : null}
      />

      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-6 md:pt-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Weekly Performance</h2>
          <p className="text-sm text-slate-600 mb-6">Track overall progress and engagement metrics</p>
          
          <dl className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Current streak</dt>
              <dd className="mt-2 text-3xl font-bold text-slate-900">{progress.streak} days</dd>
              <p className="mt-1 text-xs text-slate-500">Keep daily play going to grow the flame.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">Stars earned</dt>
              <dd className="mt-2 text-3xl font-bold text-indigo-600">{progress.stars}</dd>
              <p className="mt-1 text-xs text-indigo-600">100 points unlocks each new star.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Accuracy</dt>
              <dd className="mt-2 text-3xl font-bold text-emerald-600">{Math.round(progress.accuracy)}%</dd>
              <p className="mt-1 text-xs text-emerald-600">{progress.questionsCorrect} correct of {progress.questionsAttempted} attempts.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Completion</dt>
              <dd className="mt-2 text-3xl font-bold text-amber-600">{completionRate}%</dd>
              <p className="mt-1 text-xs text-amber-600">Modes completed: {completedModesCount}/6.</p>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Weekly Practice Summary</h2>
            <p className="text-sm text-slate-600">{selectedSetName || "Select a vocabulary set"}</p>
            <p className="text-sm text-slate-500">Each mode lights up after three correct responses. Encourage replaying the trickiest ones.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {MODE_ORDER.map((mode) => {
              const stats = progress.modeStats[mode];
              const completed = progress.completedModes.has(mode);
              const accuracy = stats.attempted === 0 ? 0 : Math.round((stats.correct / stats.attempted) * 100);

              return (
                <div
                  key={mode}
                  className={`rounded-2xl border px-5 py-4 transition-all shadow-md ${
                    completed 
                      ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100" 
                      : "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{MODE_LABELS[mode]}</h3>
                      <p className="mt-1 text-xs text-slate-600">{MODE_DESCRIPTIONS[mode]}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm ${
                        completed 
                          ? "bg-emerald-600 text-white" 
                          : "bg-slate-300 text-slate-700"
                      }`}
                    >
                      {completed ? "✓ Completed" : "In progress"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-6 text-sm text-slate-700">
                    <span>
                      Attempts: <span className="font-bold text-slate-900">{stats.attempted}</span>
                    </span>
                    <span>
                      Correct: <span className="font-bold text-slate-900">{stats.correct}</span>
                    </span>
                    <span>
                      Accuracy: <span className="font-bold text-slate-900">{accuracy}%</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <div className="flex flex-col gap-1 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Word-by-Word Progress</h2>
            <p className="text-sm text-slate-600">{selectedSetName || "Select a vocabulary set"}</p>
            <p className="text-sm text-slate-500">Focus on words marked "Needs Practice" or "Developing" for the biggest improvement.</p>
          </div>

          {wordProgress.isLoading ? (
            <div className="text-center py-8 text-slate-600">Loading word progress...</div>
          ) : wordProgress.error ? (
            <div className="text-center py-8 text-rose-600">Error: {wordProgress.error}</div>
          ) : wordProgress.words.length === 0 ? (
            <div className="text-center py-8 text-slate-600">No words found. Select a vocabulary set to see progress.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {wordProgress.words.map((word) => {
                const colors = getMasteryColor(word.masteryLevel, word.accuracy);
                return (
                  <div
                    key={word.wordId}
                    className={`rounded-xl border p-4 transition-all shadow-sm ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className={`text-base font-bold ${colors.text}`}>{word.word}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{word.definition}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap ${colors.badge}`}>
                        {colors.label}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-700">
                      <div className="flex flex-col">
                        <span className="text-slate-500">Mastery</span>
                        <span className={`font-bold ${colors.text}`}>{word.masteryLevel}/5</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Accuracy</span>
                        <span className={`font-bold ${colors.text}`}>{word.accuracy}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Attempts</span>
                        <span className="font-bold text-slate-900">{word.totalAttempts}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500">Correct</span>
                        <span className="font-bold text-emerald-700">{word.correctCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-1">Vocabulary Sets</h2>
          <p className="text-sm text-slate-600 mb-6">Print matching activities for any vocabulary set</p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vocabSets.map((set) => (
              <div key={set.id} className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">{set.name}</h3>
                <p className="text-xs text-slate-600 mb-4">{set.grade || 'No grade'}</p>
                <button
                  onClick={() => window.open(`/parent/print-matching/${set.id}`, '_blank')}
                  className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm transition hover:bg-blue-700"
                >
                  🖨️ Print Matching
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3">How to help at home</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Ask for a quick demo of today&apos;s game to celebrate progress and reinforce confidence.</li>
            <li>Focus practice time on words marked "Needs Practice" or "Developing" in the Word-by-Word Progress section above.</li>
            <li>Replay any mode that isn&apos;t completed yet—especially fill-in-the-blank and context clues for deeper mastery.</li>
            <li>Use the Manage tab to print or review the twelve words for the week offline.</li>
          </ul>
        </section>
        </div>
      </div>
    </>
  );
}
