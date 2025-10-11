"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
  gameKey: number;
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

const createSentenceWithBlank = (word: WordWithRelations) => {
  const example = word.examples?.[0]?.sentence ?? "";
  const regex = new RegExp(`\\b${word.word}\\b`, "gi");

  if (example && regex.test(example)) {
    return example.replace(regex, "_____");
  }

  return `_____ (${word.partOfSpeech ?? "word"}) ${(word.teacherDefinition || word.definition).toLowerCase()}.`;
};

export function FillInTheBlankGame({ weeklyWords, reviewWords, allWords, onResult, gameKey }: BaseGameProps) {
  const shuffledWords = useMemo(() => shuffle([...weeklyWords]), [weeklyWords, gameKey]);
  const optionPool = useMemo(() => getOptionPool(shuffledWords, reviewWords, allWords), [shuffledWords, reviewWords, allWords]);
  const questions = useMemo(() => {
    return shuffledWords.map((word) => {
      const sentence = createSentenceWithBlank(word);
      const otherOptions = shuffle(
        optionPool.filter((candidate) => candidate.id !== word.id)
      )
        .slice(0, 3)
        .map((candidate) => candidate.word);

      return {
        id: word.id,
        sentence,
        correct: word.word,
        options: shuffle([word.word, ...otherOptions]),
      };
    });
  }, [shuffledWords, optionPool]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const current = questions[index];
  const totalQuestions = questions.length;

  const choose = (option: string) => {
    if (!current || selected) return;

    setSelected(option);
    const correct = option === current.correct;
    setFeedback(correct ? "Great choice!" : `Try again—"${current.correct}" fits best here.`);

    onResult({ mode: "fill-in-the-blank", correct, pointsAwarded: correct ? 14 : 0 });

    timeoutRef.current = window.setTimeout(() => {
      setSelected(null);
      setFeedback(null);
      setIndex((prev) => (prev + 1) % questions.length);
    }, 1500);
  };

  const skip = () => {
    if (!current) return;
    setSelected(null);
    setFeedback(null);
    setIndex((prev) => (prev + 1) % questions.length);
  };

  if (!current) {
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">We need sentences to play this game—add example sentences to your vocab words!</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-emerald-100/70 backdrop-blur-sm">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 px-5 py-4 border border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">✍️</div>
          <div>
            <h2 className="text-lg font-bold text-emerald-900">Fill in the Blank</h2>
            <p className="text-sm text-emerald-600">Word {index + 1} of {totalQuestions}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === index
                    ? "bg-emerald-600 scale-125"
                    : idx < index
                    ? "bg-emerald-400"
                    : "bg-emerald-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-emerald-700">
            {Math.round(((index) / totalQuestions) * 100)}% Complete
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-600">Sentence</p>
          <p className="mt-2 text-lg font-medium text-slate-900">{current.sentence}</p>
        </div>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-emerald-300 hover:text-emerald-500"
        >
          Skip
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {current.options.map((option) => {
          const isSelected = selected === option;
          const correctOption = option === current.correct;
          const stateClass = selected
            ? correctOption
              ? "border-emerald-400 bg-emerald-50"
              : isSelected
                ? "border-rose-400 bg-rose-50"
                : "opacity-60"
            : "hover:border-emerald-200 hover:bg-emerald-50";

          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              className={`rounded-2xl border px-5 py-4 text-left text-base font-semibold transition ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          feedback.startsWith("Great")
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-rose-200 bg-rose-50 text-rose-600"
        }`}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}