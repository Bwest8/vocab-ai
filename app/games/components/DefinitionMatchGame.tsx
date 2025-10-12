"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import { toMasteryLevel } from "@/lib/study/utils";
import type { GameMode } from "@/lib/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
  gameKey: number;
}

interface MultipleChoiceQuestion {
  id: string;
  prompt: string;
  definition: string;
  teacherDefinition: string | null;
  word: string;
  options: string[];
  mastery: number;
}

const POINTS: Record<GameMode, number> = {
  "definition-match": 10,
  "reverse-definition": 12,
  "fill-in-the-blank": 14,
  "speed-round": 8,
  "matching": 10,
  "word-scramble": 10,
};

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

const buildMultipleChoiceQuestions = (
  words: WordWithRelations[],
  optionPool: WordWithRelations[],
  projector: "definition" | "word"
): MultipleChoiceQuestion[] => {
  const safePool = optionPool.length > 0 ? optionPool : words;

  return words.map((word) => {
    const otherOptions = shuffle(
      safePool.filter((candidate) => candidate.id !== word.id)
    )
      .slice(0, 3)
      .map((candidate) => (projector === "definition" ? candidate.word : (candidate.teacherDefinition || candidate.definition)));

    const masteryLevel = toMasteryLevel(word.progress?.find((item) => item.userId == null)?.masteryLevel);
    const correctOption = projector === "definition" ? word.word : (word.teacherDefinition || word.definition);
    const options = shuffle([correctOption, ...otherOptions]);

    return {
      id: word.id,
      prompt: projector === "definition" ? (word.teacherDefinition || word.definition) : word.word,
      definition: word.teacherDefinition || word.definition,
      teacherDefinition: word.teacherDefinition,
      word: word.word,
      options,
      mastery: masteryLevel,
    };
  });
};

const useMultipleChoiceRun = (
  questions: MultipleChoiceQuestion[],
  mode: GameMode,
  onResult: (result: GameResult) => void
) => {
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentQuestion = questions[index];

  const selectOption = (option: string) => {
    if (!currentQuestion || selectedOption) return;

    setSelectedOption(option);
    const correct = mode === "reverse-definition" ? option === currentQuestion.definition : option === currentQuestion.word;
    setIsCorrect(correct);
    setFeedback(
      correct ? "Nice work!" : `The correct answer was "${mode === "reverse-definition" ? (currentQuestion.teacherDefinition || currentQuestion.definition) : currentQuestion.word}".`
    );

    onResult({
      mode,
      correct,
      pointsAwarded: correct ? POINTS[mode] : 0,
    });

    timeoutRef.current = window.setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);
      setIsCorrect(null);
      setIndex((prev) => (prev + 1) % questions.length);
    }, 1200);
  };

  const skip = () => {
    if (!currentQuestion) return;
    setSelectedOption(null);
    setFeedback(null);
    setIsCorrect(null);
    setIndex((prev) => (prev + 1) % questions.length);
  };

  return {
    currentQuestion,
    currentIndex: index,
    totalQuestions: questions.length,
    selectedOption,
    feedback,
    isCorrect,
    selectOption,
    skip,
  } as const;
};

export function DefinitionMatchGame({ weeklyWords, reviewWords, allWords, onResult, gameKey }: BaseGameProps) {
  const shuffledWords = useMemo(() => shuffle([...weeklyWords]), [weeklyWords, gameKey]);
  const optionPool = useMemo(() => getOptionPool(shuffledWords, reviewWords, allWords), [shuffledWords, reviewWords, allWords]);
  const questions = useMemo(
    () => buildMultipleChoiceQuestions(shuffledWords, optionPool, "definition"),
    [shuffledWords, optionPool]
  );

  const { currentQuestion, currentIndex, totalQuestions, selectedOption, feedback, isCorrect, selectOption, skip } = useMultipleChoiceRun(
    questions,
    "definition-match",
    onResult
  );

  if (!currentQuestion) {
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">Add some words to this set to unlock the games!</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-indigo-100/70 backdrop-blur-sm">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-indigo-50 px-5 py-4 border border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📖</div>
          <div>
            <h2 className="text-lg font-bold text-indigo-900">Definition Match</h2>
            <p className="text-sm text-indigo-600">Word {currentIndex + 1} of {totalQuestions}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-indigo-600 scale-125"
                    : idx < currentIndex
                    ? "bg-indigo-400"
                    : "bg-indigo-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-indigo-700">
            {Math.round(((currentIndex) / totalQuestions) * 100)}% Complete
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-600">Definition</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{currentQuestion.prompt}</h3>
        </div>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-indigo-300 hover:text-indigo-500"
        >
          Skip
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOption === option;
          const correctOption = option === currentQuestion.word;
          const stateClass = selectedOption
            ? correctOption
              ? "border-emerald-400 bg-emerald-50"
              : isSelected
                ? "border-rose-400 bg-rose-50"
                : "opacity-60"
            : "hover:border-indigo-200 hover:bg-indigo-50";

          return (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              className={`rounded-2xl border px-5 py-4 text-left text-base font-semibold transition ${stateClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"
        }`}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}