"use client";

import type { GameMode } from "@/lib/types";
import type { WeeklyMasterySummary } from "@/lib/hooks/useGamesSession";

interface GameDashboardProps {
  selectedSetName: string;
  points: number;
  stars: number;
  accuracy: number;
  bestCombo: number;
  streak: number;
  weeklyMastery: WeeklyMasterySummary;
  weeklySchedule: Array<{
    day: string;
    focus: string;
    mode: GameMode;
    description: string;
  }>;
  completedModes: Set<GameMode>;
}

const masteryLabels: Record<number, string> = {
  0: "Not Learned",
  1: "Seen Once",
  2: "Learning",
  3: "Familiar",
  4: "Mastered",
  5: "Expert",
};

export function GameDashboard({
  selectedSetName,
  points,
  stars,
  accuracy,
  bestCombo,
  streak,
  weeklyMastery,
  weeklySchedule,
  completedModes,
}: GameDashboardProps) {
  const totalWeeklyWords = Object.values(weeklyMastery.levelDistribution).reduce((sum, count) => sum + count, 0);
  const masteredPercent = totalWeeklyWords > 0
    ? Math.round((weeklyMastery.masteredCount / totalWeeklyWords) * 100)
    : 0;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg shadow-indigo-100/70 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Current Weekly Set</p>
            <h1 className="text-2xl font-bold text-slate-900">{selectedSetName || "Select a vocab set"}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-amber-700">
              <span className="text-xl">🔥</span>
              <span className="text-sm font-semibold">{streak} day streak</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-indigo-700">
              <span className="text-xl">⭐️</span>
              <span className="text-sm font-semibold">{stars} stars</span>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Points</dt>
            <dd className="mt-2 text-3xl font-semibold text-slate-900">{points}</dd>
            <p className="mt-1 text-xs text-slate-500">Earn 100 points to collect a new star.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Accuracy</dt>
            <dd className="mt-2 text-3xl font-semibold text-emerald-600">{Math.round(accuracy)}%</dd>
            <p className="mt-1 text-xs text-slate-500">Keep it above 80% to unlock bonus rounds.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Best Combo</dt>
            <dd className="mt-2 text-3xl font-semibold text-indigo-600">×{bestCombo}</dd>
            <p className="mt-1 text-xs text-slate-500">Combos build when you keep answering correctly!</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-5 py-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Weekly Mastery</dt>
            <dd className="mt-2 text-3xl font-semibold text-slate-900">{Math.round(weeklyMastery.averageLevel * 20)}%</dd>
            <p className="mt-1 text-xs text-slate-500">{weeklyMastery.masteredCount} mastered • {weeklyMastery.needsReviewCount} need review</p>
          </div>
        </dl>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Mastery Breakdown</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {Object.entries(weeklyMastery.levelDistribution).map(([level, count]) => (
              <div key={level} className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-50 to-white px-5 py-3">
                <div>
                  <p className="text-xs font-semibold text-indigo-600">Level {level}</p>
                  <p className="text-sm font-medium text-slate-900">{masteryLabels[Number(level)]}</p>
                </div>
                <span className="text-lg font-semibold text-indigo-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg shadow-indigo-100/70 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Weekly Practice Map</p>
            <h2 className="text-xl font-semibold text-slate-900">Follow the trail to unlock the weekly mastery test</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-indigo-600">{masteredPercent}% of targets achieved</p>
            <p className="text-xs text-slate-500">Each day you complete a mode earns extra bonus points.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-7">
          {weeklySchedule.map((slot) => {
            const completed = completedModes.has(slot.mode);
            return (
              <div
                key={slot.day}
                className={`relative overflow-hidden rounded-2xl border px-4 py-4 transition-all ${
                  completed
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{slot.day}</p>
                  {completed && <span className="text-lg" aria-label="Completed">✅</span>}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{slot.focus}</h3>
                <p className="mt-2 text-xs text-slate-500">{slot.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
