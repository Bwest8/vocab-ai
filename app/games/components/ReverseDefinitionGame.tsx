"use client";

import { useMemo, useState } from "react";
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

export function ReverseDefinitionGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const shuffledWords = useMemo(() => shuffle([...weeklyWords]), [weeklyWords]);

  const optionPool = useMemo(() => {
    const combined = [...shuffledWords];
    reviewWords.forEach((word) => {
      if (!combined.some((item) => item.id === word.id)) {
        combined.push(word);
      }
    });
    allWords.forEach((word) => {
      if (!combined.some((item) => item.id === word.id)) {
        combined.push(word);
      }
    });
    return combined;
  }, [shuffledWords, reviewWords, allWords]);

  const questions = useMemo(() => {
    const safePool = optionPool.length > 0 ? optionPool : shuffledWords;

    return shuffledWords.map((word) => {
      const otherOptions = shuffle(
        safePool.filter((candidate) => candidate.id !== word.id)
      )
        .slice(0, 3)
        .map((candidate) => (candidate.teacherDefinition || candidate.definition));

      const correctOption = word.teacherDefinition || word.definition;
      const options = shuffle([correctOption, ...otherOptions]);

      return {
        id: word.id,
        prompt: word.word,
        definition: word.teacherDefinition || word.definition,
        teacherDefinition: word.teacherDefinition,
        word: word.word,
        options,
        mastery: 0, // We'll calculate this if needed
      };
    });
  }, [shuffledWords, optionPool]);

  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentQuestion = questions[index];
  const totalQuestions = questions.length;

  const selectOption = (option: string) => {
    if (!currentQuestion || selectedOption) return;

    setSelectedOption(option);
    const correct = option === currentQuestion.definition;
    setIsCorrect(correct);
    setFeedback(
      correct ? "Nice work!" : `The correct answer was "${currentQuestion.teacherDefinition || currentQuestion.definition}".`
    );

    onResult({
      mode: "reverse-definition",
      correct,
      pointsAwarded: correct ? 12 : 0,
      wordId: currentQuestion.id,
    });

    setTimeout(() => {
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

  if (!currentQuestion) {
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">We need some vocabulary words to get started.</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-purple-100/70 backdrop-blur-sm">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-purple-50 px-5 py-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔄</div>
          <div>
            <h2 className="text-lg font-bold text-purple-900">Reverse Mode</h2>
            <p className="text-sm text-purple-600">Word {index + 1} of {totalQuestions}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === index
                    ? "bg-purple-600 scale-125"
                    : idx < index
                    ? "bg-purple-400"
                    : "bg-purple-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-purple-700">
            {Math.round(((index) / totalQuestions) * 100)}% Complete
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-purple-600">Word</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{currentQuestion.word}</h3>
        </div>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-purple-300 hover:text-purple-500"
        >
          Skip
        </button>
      </div>

      <div className="mt-6 grid gap-3">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOption === option;
          const correctOption = option === currentQuestion.definition;
          const stateClass = selectedOption
            ? correctOption
              ? "border-emerald-400 bg-emerald-50"
              : isSelected
                ? "border-rose-400 bg-rose-50"
                : "opacity-60"
            : "hover:border-purple-200 hover:bg-purple-50";

          return (
            <button
              key={option}
              type="button"
              onClick={() => selectOption(option)}
              className={`rounded-2xl border px-5 py-4 text-left text-sm font-medium transition ${stateClass}`}
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

ReverseDefinitionGame.static = false;