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
  spelling: "Spelling Challenge",
  "example-sentence": "Context Clues",
};

const MODE_DESCRIPTIONS: Record<GameMode, string> = {
  "definition-match": "Match definitions to new words to build familiarity.",
  "reverse-definition": "Show the word first and choose the correct meaning.",
  "fill-in-the-blank": "Use context sentences to select the right word.",
  "speed-round": "Timed review that boosts confidence and recall.",
  spelling: "Type the word after hearing its definition.",
  "example-sentence": "Identify where vocabulary words appear in real sentences.",
};

const MODE_ORDER: GameMode[] = [
  "definition-match",
  "reverse-definition",
  "fill-in-the-blank",
  "speed-round",
  "spelling",
  "example-sentence",
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
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-50 via-indigo-50 to-white pb-20 pt-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg shadow-indigo-100/70 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Caregiver overview</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Parent Dashboard</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Track this week&apos;s vocabulary practice, celebrate milestones, and spot the modes that need a little extra encouragement.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">View progress for</label>
              <select
                value={selectedSetId}
                onChange={(event) => handleSelectSet(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100"
              >
                {vocabSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{progress.isLoading ? "Refreshing progress…" : "Last updated moments ago"}</span>
                {selectedSetId && (
                  <button
                    onClick={handleResetProgress}
                    disabled={isResetting}
                    className="rounded-2xl bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {isResetting ? 'Resetting...' : 'Reset Progress'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Current streak</dt>
              <dd className="mt-2 text-3xl font-semibold text-slate-900">{progress.streak} days</dd>
              <p className="mt-1 text-xs text-slate-500">Keep daily play going to grow the flame.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Stars earned</dt>
              <dd className="mt-2 text-3xl font-semibold text-indigo-600">{progress.stars}</dd>
              <p className="mt-1 text-xs text-slate-500">100 points unlocks each new star.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Accuracy</dt>
              <dd className="mt-2 text-3xl font-semibold text-emerald-600">{Math.round(progress.accuracy)}%</dd>
              <p className="mt-1 text-xs text-slate-500">{progress.questionsCorrect} correct of {progress.questionsAttempted} attempts.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Completion</dt>
              <dd className="mt-2 text-3xl font-semibold text-slate-900">{completionRate}%</dd>
              <p className="mt-1 text-xs text-slate-500">Modes completed: {progress.completedModes.size}/6.</p>
            </div>
          </dl>
        </header>

        <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg shadow-indigo-100/70 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">Weekly practice summary</p>
            <h2 className="text-xl font-semibold text-slate-900">{selectedSetName || "Select a vocabulary set"}</h2>
            <p className="text-sm text-slate-600">Each mode lights up after three correct responses. Encourage replaying the trickiest ones.</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {MODE_ORDER.map((mode) => {
              const stats = progress.modeStats[mode];
              const completed = progress.completedModes.has(mode);
              const accuracy = stats.attempted === 0 ? 0 : Math.round((stats.correct / stats.attempted) * 100);

              return (
                <div
                  key={mode}
                  className={`rounded-2xl border px-5 py-4 transition ${
                    completed ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{MODE_LABELS[mode]}</h3>
                      <p className="mt-1 text-xs text-slate-500">{MODE_DESCRIPTIONS[mode]}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        completed ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {completed ? "Completed" : "In progress"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
                    <span>
                      Attempts: <span className="font-semibold text-slate-900">{stats.attempted}</span>
                    </span>
                    <span>
                      Correct: <span className="font-semibold text-slate-900">{stats.correct}</span>
                    </span>
                    <span>
                      Accuracy: <span className="font-semibold text-slate-900">{accuracy}%</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {progress.error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {progress.error}
          </div>
        )}

        <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg shadow-indigo-100/70 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-slate-900">How to help at home</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Ask for a quick demo of today&apos;s game to celebrate progress and reinforce confidence.</li>
            <li>Replay any mode that isn&apos;t completed yet—especially fill-in-the-blank and context clues for deeper mastery.</li>
            <li>Use the Manage tab to print or review the twelve words for the week offline.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
