"use client";

import { useEffect, useMemo, useState } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
}

const shuffle = <T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const getOptionPool = (weekly: WordWithRelations[], review: WordWithRelations[], all: WordWithRelations[]) => {
  const combined = [...weekly];
  review.forEach((word) => {
    if (!combined.some((item) => item.id === word.id)) {
      combined.push(word);
    }
  });
  all.forEach((word) => {
    if (!combined.some((item) => item.id === word.id)) {
      combined.push(word);
    }
  });
  return combined;
};

export function SpeedRoundGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const questionPool = useMemo(() => shuffle(getOptionPool(weeklyWords, reviewWords, allWords)), [weeklyWords, reviewWords, allWords]);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });

  const start = () => {
    setIsActive(true);
    setTimeLeft(60);
    setScore({ correct: 0, attempted: 0 });
    setIndex(0);
  };

  useEffect(() => {
    if (!isActive) return () => undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isActive]);

  const currentWord = questionPool[index % questionPool.length];

  const ask = useMemo(() => {
    if (!currentWord) return null;
    const pool = questionPool.filter((word) => word.id !== currentWord.id);
    const options = shuffle(pool)
      .slice(0, 3)
      .map((word) => word.word);
    return {
      prompt: currentWord.definition,
      correct: currentWord.word,
      options: shuffle([currentWord.word, ...options]),
    };
  }, [currentWord, questionPool]);

  const answer = (option: string) => {
    if (!ask || !isActive) return;

    const correct = option === ask.correct;
    setScore((prev) => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (correct ? 1 : 0),
    }));
    setIndex((prev) => prev + 1);

    onResult({
      mode: "speed-round",
      correct,
      pointsAwarded: correct ? 8 + Math.max(0, timeLeft - 20) : 0,
      timeRemaining: timeLeft,
    });
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-amber-100/70 backdrop-blur-sm">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-4 border border-amber-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚡️</div>
          <div>
            <h2 className="text-lg font-bold text-amber-900">Speed Round</h2>
            <p className="text-sm text-amber-600">
              {isActive ? `Question ${score.attempted + 1}` : "Ready to start!"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`rounded-xl px-4 py-2 font-bold text-lg ${
            timeLeft <= 10 && isActive
              ? "bg-rose-100 text-rose-700 animate-pulse"
              : "bg-amber-100 text-amber-700"
          }`}>
            ⏱️ {timeLeft}s
          </div>
          {isActive && (
            <p className="text-xs font-semibold text-amber-700">
              {score.correct}/{score.attempted} correct
            </p>
          )}
        </div>
      </div>

      {!isActive ? (
        <div className="mt-6 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-amber-200 transition hover:scale-[1.02]"
          >
            Start Speed Round
          </button>
          <p className="text-sm text-slate-500">You&apos;ll face quick definition match questions with time bonuses for fast answers.</p>
          {score.attempted > 0 && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Final score: {score.correct}/{score.attempted} ({score.attempted > 0 ? Math.round((score.correct / score.attempted) * 100) : 0}%)
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Definition</h4>
            <p className="mt-2 text-base font-medium text-slate-900">{ask?.prompt}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ask?.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => answer(option)}
                className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-left text-sm font-semibold transition hover:border-amber-400 hover:bg-amber-100"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}