"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import { toMasteryLevel } from "@/lib/study/utils";
import type { GameMode } from "@/lib/games/types";
import type { GameResult } from "../hooks/useGameProgress";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
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
  spelling: 16,
  "example-sentence": 10,
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

const createSentenceWithBlank = (word: WordWithRelations) => {
  const example = word.examples?.[0]?.sentence ?? "";
  const regex = new RegExp(`\\b${word.word}\\b`, "gi");

  if (example && regex.test(example)) {
    return example.replace(regex, "_____");
  }

  return `_____ (${word.partOfSpeech ?? "word"}) ${(word.teacherDefinition || word.definition).toLowerCase()}.`;
};

const createExampleSentence = (word: WordWithRelations) => {
  const example = word.examples?.[0]?.sentence;
  if (example) return example;
  return `In a sentence: "${word.word}" means ${(word.teacherDefinition || word.definition).toLowerCase()}.`;
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
    selectedOption,
    feedback,
    isCorrect,
    selectOption,
    skip,
  } as const;
};

export function DefinitionMatchGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const optionPool = useMemo(() => getOptionPool(weeklyWords, reviewWords, allWords), [weeklyWords, reviewWords, allWords]);
  const questions = useMemo(
    () => buildMultipleChoiceQuestions(weeklyWords, optionPool, "definition"),
    [weeklyWords, optionPool]
  );

  const { currentQuestion, selectedOption, feedback, isCorrect, selectOption, skip } = useMultipleChoiceRun(
    questions,
    "definition-match",
    onResult
  );

  if (!currentQuestion) {
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">Add some words to this set to unlock the games!</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-indigo-100/70 backdrop-blur-sm">
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

export function ReverseDefinitionGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const optionPool = useMemo(() => getOptionPool(weeklyWords, reviewWords, allWords), [weeklyWords, reviewWords, allWords]);
  const questions = useMemo(
    () => buildMultipleChoiceQuestions(weeklyWords, optionPool, "word"),
    [weeklyWords, optionPool]
  );

  const { currentQuestion, selectedOption, feedback, isCorrect, selectOption, skip } = useMultipleChoiceRun(
    questions,
    "reverse-definition",
    onResult
  );

  if (!currentQuestion) {
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">We need some vocabulary words to get started.</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-purple-100/70 backdrop-blur-sm">
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

export function FillInTheBlankGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const optionPool = useMemo(() => getOptionPool(weeklyWords, reviewWords, allWords), [weeklyWords, reviewWords, allWords]);
  const questions = useMemo(() => {
    return weeklyWords.map((word) => {
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
  }, [weeklyWords, optionPool]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const current = questions[index];

  const choose = (option: string) => {
    if (!current || selected) return;

    setSelected(option);
    const correct = option === current.correct;
    setFeedback(correct ? "Great choice!" : `Try again—"${current.correct}" fits best here.`);

    onResult({ mode: "fill-in-the-blank", correct, pointsAwarded: correct ? POINTS["fill-in-the-blank"] : 0 });

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

export function SpeedRoundGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const questionPool = useMemo(() => shuffle(getOptionPool(weeklyWords, reviewWords, allWords)), [weeklyWords, reviewWords, allWords]);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });
  const timerRef = useRef<number | null>(null);

  const start = () => {
    setIsActive(true);
    setTimeLeft(60);
    setScore({ correct: 0, attempted: 0 });
    setIndex(0);
  };

  useEffect(() => {
    if (!isActive) return () => undefined;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current!);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
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
      prompt: currentWord.teacherDefinition || currentWord.definition,
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
      pointsAwarded: correct ? POINTS["speed-round"] + Math.max(0, timeLeft - 20) : 0,
      timeRemaining: timeLeft,
    });
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-amber-100/70 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-600">Rapid review</p>
          <h3 className="text-2xl font-semibold text-slate-900">Answer as many as you can in 60 seconds!</h3>
        </div>
        <div className="rounded-2xl bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-700">
          Time left: {timeLeft}s
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
              Final score: {score.correct}/{score.attempted}
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

          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span>Correct: {score.correct}</span>
            <span>Attempted: {score.attempted}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function SpellingGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const wordQueue = useMemo(() => {
    const combined = [...weeklyWords];

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

    return shuffle(combined);
  }, [weeklyWords, reviewWords, allWords]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const current = wordQueue[index % wordQueue.length];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!current || !input) return;

    const guess = input.trim().toLowerCase();
    const correct = guess === current.word.toLowerCase();

    setFeedback(
      correct
        ? "Perfect spelling!"
        : `Almost! The correct spelling is "${current.word}".`
    );
    setIsCorrect(correct);
    onResult({ mode: "spelling", correct, pointsAwarded: correct ? POINTS.spelling : 0 });
    setInput("");
    setIndex((prev) => prev + 1);
  };

  if (!current) {
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">Practice some study sessions first to unlock spelling!</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-rose-100/70 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-rose-600">Definition</p>
      <p className="mt-2 text-lg font-medium text-slate-900">{current.teacherDefinition || current.definition}</p>
      {current.pronunciation && (
        <p className="mt-1 text-sm text-slate-500">Pronunciation: {current.pronunciation}</p>
      )}

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type the word here"
          className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-base outline-none transition focus:border-rose-400 focus:ring focus:ring-rose-200"
        />
        <button
          type="submit"
          className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-200 transition hover:scale-[1.02]"
        >
          Check spelling
        </button>
      </form>

      {feedback && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          isCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"
        }`}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

export function ExampleSentenceGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const optionPool = useMemo(() => getOptionPool(weeklyWords, reviewWords, allWords), [weeklyWords, reviewWords, allWords]);
  const questions = useMemo(() => {
    const source = weeklyWords.length > 0 ? weeklyWords : optionPool;
    return source.map((word) => {
      const otherOptions = shuffle(optionPool.filter((candidate) => candidate.id !== word.id))
        .slice(0, 3)
        .map((candidate) => candidate.word);

      return {
        id: word.id,
        sentence: createExampleSentence(word),
        correct: word.word,
        options: shuffle([word.word, ...otherOptions]),
      };
    });
  }, [weeklyWords, optionPool]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  const current = questions[index];

  const choose = (option: string) => {
    if (!current || selected) return;

    setSelected(option);
    const correct = option === current.correct;
    setFeedback(correct ? "Context clues unlocked!" : `That sentence was describing "${current.correct}".`);

    onResult({ mode: "example-sentence", correct, pointsAwarded: correct ? POINTS["example-sentence"] : 0 });

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
    return <p className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">We&apos;ll add this mode once we have more context sentences.</p>;
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-slate-200/70 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-600">Example sentence</p>
          <p className="mt-2 text-lg font-medium text-slate-900">{current.sentence}</p>
        </div>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
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
            : "hover:border-slate-200 hover:bg-slate-100";

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
          feedback.startsWith("Context")
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
