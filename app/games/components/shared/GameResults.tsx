"use client";

import { WordWithRelations } from "@/lib/study/types";

interface GameResultsProps {
  icon: string;
  title: string;
  score: number;
  totalQuestions: number;
  pointsEarned: number;
  wordsToReview?: Array<{
    word: string;
    definition: string;
    wasCorrect: boolean;
  }>;
  onPlayAgain: () => void;
  onBackToGames: () => void;
  color: "indigo" | "purple" | "emerald" | "amber" | "pink" | "blue";
  encouragementLevel?: "excellent" | "good" | "needs-practice";
}

const colorClasses = {
  indigo: {
    gradient: "from-indigo-500 to-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
    text: "text-indigo-900",
  },
  purple: {
    gradient: "from-purple-500 to-purple-600",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    text: "text-purple-900",
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    text: "text-emerald-900",
  },
  amber: {
    gradient: "from-amber-500 to-amber-600",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    text: "text-amber-900",
  },
  pink: {
    gradient: "from-pink-500 to-pink-600",
    button: "bg-pink-600 hover:bg-pink-700 text-white",
    badge: "bg-pink-100 text-pink-800 border-pink-300",
    text: "text-pink-900",
  },
  blue: {
    gradient: "from-blue-500 to-blue-600",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    text: "text-blue-900",
  },
};

const encouragementMessages = {
  excellent: {
    title: "Outstanding Performance!",
    message: "You're mastering these vocabulary words! Keep up the amazing work!",
    emoji: "🌟",
  },
  good: {
    title: "Great Job!",
    message: "You're making excellent progress! A little more practice and you'll have these mastered!",
    emoji: "🎯",
  },
  "needs-practice": {
    title: "Keep Learning!",
    message: "Every attempt makes you stronger! Review the words below and try again!",
    emoji: "💪",
  },
};

export function GameResults({
  icon,
  title,
  score,
  totalQuestions,
  pointsEarned,
  wordsToReview = [],
  onPlayAgain,
  onBackToGames,
  color,
  encouragementLevel = "good",
}: GameResultsProps) {
  const colors = colorClasses[color];
  const encouragement = encouragementMessages[encouragementLevel];
  const percentage = Math.round((score / totalQuestions) * 100);
  const incorrectWords = wordsToReview.filter((w) => !w.wasCorrect);

  return (
    <div className="rounded-3xl border border-white/80 bg-white/95 p-8 shadow-2xl backdrop-blur-sm md:p-12">
      {/* Header */}
      <div className={`mb-8 rounded-2xl bg-gradient-to-r ${colors.gradient} p-8 text-center shadow-lg`}>
        <div className="mb-4 text-6xl">{icon}</div>
        <h1 className="text-3xl font-extrabold text-white">Game Complete!</h1>
      </div>

      {/* Encouragement */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 p-6 text-center">
        <div className="mb-3 text-5xl">{encouragement.emoji}</div>
        <h2 className={`mb-2 text-2xl font-bold ${colors.text}`}>{encouragement.title}</h2>
        <p className="text-lg text-slate-700">{encouragement.message}</p>
      </div>

      {/* Score Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center">
          <div className="mb-1 text-4xl font-extrabold text-blue-900">{score}</div>
          <div className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Correct Answers
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center">
          <div className="mb-1 text-4xl font-extrabold text-purple-900">{percentage}%</div>
          <div className="text-sm font-semibold uppercase tracking-wide text-purple-700">
            Accuracy
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-6 text-center">
          <div className="mb-1 text-4xl font-extrabold text-green-900">{pointsEarned}</div>
          <div className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Points Earned
          </div>
        </div>
      </div>

      {/* Words to Review */}
      {incorrectWords.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-bold text-slate-800">📚 Words to Review</h3>
          <div className="space-y-3">
            {incorrectWords.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-lg font-bold text-slate-900">{item.word}</p>
                <p className="mt-1 text-base text-slate-700">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className={`w-full rounded-2xl py-5 text-xl font-bold shadow-lg transition-all active:scale-95 ${colors.button}`}
        >
          Play Again 🔄
        </button>
        <button
          type="button"
          onClick={onBackToGames}
          className="w-full rounded-2xl border-2 border-slate-300 bg-white py-5 text-xl font-bold text-slate-700 shadow-lg transition-all hover:bg-slate-50 active:scale-95"
        >
          Back to Games
        </button>
      </div>
    </div>
  );
}
