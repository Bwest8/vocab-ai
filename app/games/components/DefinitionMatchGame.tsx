"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WordWithRelations } from "@/lib/study/types";
import { toMasteryLevel } from "@/lib/study/utils";
import type { GameMode } from "@/lib/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";
import {
  GameHeader,
  GameContainer,
  QuestionCard,
  AnswerButton,
  FeedbackMessage,
  GameIntro,
  GameResults,
} from "./shared";

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

interface GameSession {
  questions: MultipleChoiceQuestion[];
  results: Array<{ wordId: string; word: string; definition: string; correct: boolean }>;
  currentIndex: number;
  score: number;
  pointsEarned: number;
}

const POINTS: Record<GameMode, number> = {
  "definition-match": 10,
  "reverse-definition": 12,
  "fill-in-the-blank": 14,
  "speed-round": 8,
  "matching": 10,
  "word-scramble": 10,
};

const QUESTIONS_PER_SESSION = 10;

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

type GameState = "intro" | "playing" | "results";

export function DefinitionMatchGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const shuffledWords = useMemo(() => shuffle([...weeklyWords]).slice(0, QUESTIONS_PER_SESSION), [weeklyWords]);
  const optionPool = useMemo(() => getOptionPool(shuffledWords, reviewWords, allWords), [shuffledWords, reviewWords, allWords]);
  const questions = useMemo(
    () => buildMultipleChoiceQuestions(shuffledWords, optionPool, "definition"),
    [shuffledWords, optionPool]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startGame = () => {
    setSession({
      questions,
      results: [],
      currentIndex: 0,
      score: 0,
      pointsEarned: 0,
    });
    setGameState("playing");
  };

  const selectOption = (option: string) => {
    if (!session || selectedOption) return;

    const currentQuestion = session.questions[session.currentIndex];
    setSelectedOption(option);
    const correct = option === currentQuestion.word;

    setFeedback({
      correct,
      message: correct ? "" : `The correct answer was "${currentQuestion.word}".`,
    });

    const points = correct ? POINTS["definition-match"] : 0;

    onResult({
      mode: "definition-match",
      correct,
      pointsAwarded: points,
      wordId: currentQuestion.id,
    });

    const newResults = [
      ...session.results,
      {
        wordId: currentQuestion.id,
        word: currentQuestion.word,
        definition: currentQuestion.definition,
        correct,
      },
    ];

    const newSession = {
      ...session,
      results: newResults,
      score: session.score + (correct ? 1 : 0),
      pointsEarned: session.pointsEarned + points,
    };

    setSession(newSession);

    timeoutRef.current = window.setTimeout(() => {
      setSelectedOption(null);
      setFeedback(null);

      if (session.currentIndex + 1 >= session.questions.length) {
        setGameState("results");
      } else {
        setSession({ ...newSession, currentIndex: session.currentIndex + 1 });
      }
    }, 2500);
  };

  const skip = () => {
    if (!session) return;
    setSelectedOption(null);
    setFeedback(null);

    if (session.currentIndex + 1 >= session.questions.length) {
      setGameState("results");
    } else {
      setSession({ ...session, currentIndex: session.currentIndex + 1 });
    }
  };

  const playAgain = () => {
    setSession(null);
    setSelectedOption(null);
    setFeedback(null);
    setGameState("intro");
  };

  if (questions.length === 0) {
    return (
      <GameContainer>
        <p className="rounded-2xl bg-white/80 p-6 text-center text-lg text-slate-500">
          Add some words to this set to unlock the games!
        </p>
      </GameContainer>
    );
  }

  if (gameState === "intro") {
    return (
      <GameContainer>
        <GameIntro
          icon="📖"
          title="Definition Match"
          description="Read the definition and choose the correct vocabulary word from four options."
          objective="Master word meanings by matching definitions to their corresponding words."
          difficulty="Easy"
          questionsCount={questions.length}
          onStart={startGame}
          color="indigo"
        />
      </GameContainer>
    );
  }

  if (gameState === "results" && session) {
    const percentage = (session.score / session.questions.length) * 100;
    const encouragementLevel = percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : "needs-practice";

    return (
      <GameContainer>
        <GameResults
          icon="📖"
          title="Definition Match"
          score={session.score}
          totalQuestions={session.questions.length}
          pointsEarned={session.pointsEarned}
          wordsToReview={session.results.map((r) => ({
            word: r.word,
            definition: r.definition,
            wasCorrect: r.correct,
          }))}
          onPlayAgain={playAgain}
          onBackToGames={() => router.push("/games")}
          color="indigo"
          encouragementLevel={encouragementLevel}
        />
      </GameContainer>
    );
  }

  if (!session) return null;

  const currentQuestion = session.questions[session.currentIndex];

  return (
    <GameContainer>
      <GameHeader
        icon="📖"
        title="Definition Match"
        currentQuestion={session.currentIndex + 1}
        totalQuestions={session.questions.length}
        color="indigo"
        showProgress={true}
        showBack={false}
      />

      {/* iPad Landscape Grid: 60/40 split */}
      <div className="flex flex-1 flex-col gap-6 landscape:flex-row landscape:gap-8">
        {/* Main Area - Definition + Answers */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Definition Card */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 shadow-lg landscape:h-[180px] landscape:flex landscape:flex-col landscape:justify-center landscape:p-10">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Definition</p>
            <h3 className="mt-3 text-3xl font-bold leading-snug text-slate-900 landscape:mt-2 landscape:text-2xl">
              {currentQuestion.prompt}
            </h3>
          </div>

          {/* Answer Grid - 2x2 */}
          <div className="grid flex-1 grid-cols-2 gap-5 landscape:gap-6">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.word;
              const showCorrect = selectedOption !== null && isCorrect;
              const showWrong = isSelected && !isCorrect;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectOption(option)}
                  disabled={selectedOption !== null}
                  className={`flex items-center justify-center rounded-2xl border-4 p-8 text-2xl font-bold shadow-lg transition-all active:scale-95 landscape:p-6 landscape:text-xl ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-100 text-emerald-900 scale-105"
                      : showWrong
                        ? "border-rose-500 bg-rose-100 text-rose-900"
                        : selectedOption
                          ? "border-slate-300 bg-slate-100 text-slate-400 opacity-40"
                          : "border-indigo-300 bg-white text-slate-800 hover:border-indigo-500 hover:bg-indigo-50"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Sidebar - Only shows when feedback exists */}
        {feedback && (
          <div className="landscape:w-[38%] landscape:flex landscape:flex-col">
            <div
              className={`flex h-full flex-col justify-center rounded-2xl border-4 p-8 shadow-xl landscape:p-10 ${
                feedback.correct
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-rose-400 bg-rose-50"
              }`}
            >
              <div className="text-center">
                <div className="text-7xl landscape:text-6xl">{feedback.correct ? "✅" : "💡"}</div>
                <p
                  className={`mt-6 text-3xl font-bold landscape:mt-5 landscape:text-2xl ${
                    feedback.correct ? "text-emerald-900" : "text-rose-900"
                  }`}
                >
                  {feedback.correct ? "Excellent!" : "Not quite!"}
                </p>
                {!feedback.correct && (
                  <p className="mt-4 text-xl font-semibold text-rose-800 landscape:text-lg">
                    {feedback.message}
                  </p>
                )}
              </div>

              <div className="mt-8 rounded-xl bg-white/70 p-6 landscape:mt-6 landscape:p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Remember
                </p>
                <p className="mt-3 text-2xl font-bold text-slate-900 landscape:mt-2 landscape:text-xl">
                  {currentQuestion.word}
                </p>
                <p className="mt-2 text-lg leading-snug text-slate-700 landscape:text-base">
                  {currentQuestion.definition}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameContainer>
  );
}