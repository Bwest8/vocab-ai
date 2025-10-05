"use client";

import { useMemo, useState } from "react";
import type { GameMode } from "@/lib/types";
import { useGamesSession } from "@/lib/hooks/useGamesSession";
import { useGameProgress } from "@/lib/hooks/useGameProgress";

const MODE_LABELS: Record<GameMode, string> = {
  "definition-match": "Definition Match",
  "reverse-definition": "Reverse Mode",
  "fill-in-the-blank": "Fill in the Blank",
  "speed-round": "Speed Round",
};

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  "definition-match": "Match definitions to new words to build familiarity.",
  "reverse-definition": "Show the word first and choose the correct meaning.",
  "fill-in-the-blank": "Use context sentences to select the right word.",
  "speed-round": "Timed review that boosts confidence and recall.",
};

const MODE_ORDER: GameMode[] = [
  "definition-match",
  "reverse-definition",
  "fill-in-the-blank",
  "speed-round",
];

export default function ParentDashboardPage() {
  const {
    vocabSets,
    selectedSetId,
    selectedSetName,
    handleSelectSet,
  } = useGamesSession();

  const progress = useGameProgress(selectedSetId || null);
  const [isResetting, setIsResetting] = useState(false);

  const completionRate = useMemo(() => {
    if (progress.questionsAttempted === 0) {
      return 0;
    }
    return Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100);
  }, [progress.questionsAttempted, progress.questionsCorrect]);

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
    <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-4 md:pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm md:text-base uppercase tracking-wide text-indigo-600 font-semibold">Caregiver Overview</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">Parent Dashboard</h1>
            <p className="mt-3 text-base md:text-lg text-slate-600 max-w-2xl">
              Track this week&apos;s vocabulary practice, celebrate milestones, and spot the modes that need a little extra encouragement.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div className="flex flex-col items-start gap-2">
              <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">View progress for</label>
              <select
                value={selectedSetId}
                onChange={(event) => handleSelectSet(event.target.value)}
                className="w-full min-w-[240px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100"
              >
                {vocabSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSetId && (
              <button
                onClick={handleResetProgress}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-md transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? 'Resetting...' : '🔄 Reset Progress'}
              </button>
            )}
          </div>
        </header>

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
              <p className="mt-1 text-xs text-amber-600">Modes completed: {progress.completedModes.size}/6.</p>
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

        {progress.error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 shadow-md">
            {progress.error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3">How to help at home</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Ask for a quick demo of today&apos;s game to celebrate progress and reinforce confidence.</li>
            <li>Replay any mode that isn&apos;t completed yet—especially fill-in-the-blank and context clues for deeper mastery.</li>
            <li>Use the Manage tab to print or review the twelve words for the week offline.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
