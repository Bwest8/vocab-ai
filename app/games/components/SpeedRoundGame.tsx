"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";
import {
  GameHeader,
  GameContainer,
  QuestionCard,
  AnswerButton,
  GameIntro,
  GameResults,
} from "./shared";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
}

interface GameSession {
  questions: Array<{
    id: string;
    word: string;
    definition: string;
    prompt: string;
    options: string[];
  }>;
  results: Array<{ wordId: string; word: string; definition: string; correct: boolean }>;
  currentIndex: number;
  score: number;
  pointsEarned: number;
}

const GAME_DURATION = 60; // 60 seconds
const BASE_POINTS = 8;

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

type GameState = "intro" | "playing" | "results";

export function SpeedRoundGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [session, setSession] = useState<GameSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isActive, setIsActive] = useState(false);

  const questionPool = useMemo(() => shuffle(getOptionPool(weeklyWords, reviewWords, allWords)), [weeklyWords, reviewWords, allWords]);

  const prepareQuestions = useMemo(() => {
    return questionPool.map((word) => {
      const pool = questionPool.filter((w) => w.id !== word.id);
      const otherOptions = shuffle(pool)
        .slice(0, 3)
        .map((w) => w.word);

      return {
        id: word.id,
        word: word.word,
        definition: word.teacherDefinition || word.definition,
        prompt: word.teacherDefinition || word.definition,
        options: shuffle([word.word, ...otherOptions]),
      };
    });
  }, [questionPool]);

  useEffect(() => {
    if (!isActive) return () => undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsActive(false);
          setGameState("results");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isActive]);

  const startGame = () => {
    setSession({
      questions: prepareQuestions,
      results: [],
      currentIndex: 0,
      score: 0,
      pointsEarned: 0,
    });
    setTimeLeft(GAME_DURATION);
    setIsActive(true);
    setGameState("playing");
  };

  const answer = (option: string) => {
    if (!session || !isActive) return;

    const currentQuestion = session.questions[session.currentIndex];
    const correct = option === currentQuestion.word;

    const points = correct ? BASE_POINTS + Math.max(0, timeLeft - 20) : 0;

    onResult({
      mode: "speed-round",
      correct,
      pointsAwarded: points,
      timeRemaining: timeLeft,
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
      currentIndex: (session.currentIndex + 1) % session.questions.length,
    };

    setSession(newSession);
  };

  const playAgain = () => {
    setSession(null);
    setTimeLeft(GAME_DURATION);
    setIsActive(false);
    setGameState("intro");
  };

  if (questionPool.length === 0) {
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
          icon="⚡"
          title="Speed Round"
          description="Race against the clock! Answer as many definition-match questions as you can in 60 seconds. Faster answers earn bonus points!"
          objective="Test your quick thinking and vocabulary recall under time pressure."
          difficulty="Hard"
          questionsCount={questionPool.length}
          onStart={startGame}
          color="amber"
        />
      </GameContainer>
    );
  }

  if (gameState === "results" && session) {
    const percentage = session.results.length > 0 ? (session.score / session.results.length) * 100 : 0;
    const encouragementLevel = percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : "needs-practice";

    return (
      <GameContainer>
        <GameResults
          icon="⚡"
          title="Speed Round"
          score={session.score}
          totalQuestions={session.results.length}
          pointsEarned={session.pointsEarned}
          wordsToReview={session.results.map((r) => ({
            word: r.word,
            definition: r.definition,
            wasCorrect: r.correct,
          }))}
          onPlayAgain={playAgain}
          onBackToGames={() => router.push("/games")}
          color="amber"
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
        icon="⚡"
        title="Speed Round"
        subtitle={`Question ${session.results.length + 1}`}
        color="amber"
        showProgress={false}
        showBack={false}
      />

      {/* Timer Display */}
      <div className={`rounded-2xl p-6 text-center shadow-lg ${
        timeLeft <= 10
          ? "bg-gradient-to-r from-rose-500 to-orange-500 animate-pulse"
          : "bg-gradient-to-r from-amber-500 to-orange-500"
      }`}>
        <div className="text-6xl font-extrabold text-white">{timeLeft}</div>
        <div className="mt-2 text-lg font-semibold text-white/90">seconds remaining</div>
        <div className="mt-3 text-base font-bold text-white">
          {session.score} correct out of {session.results.length} answered
        </div>
      </div>

      <QuestionCard>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-600">Quick! What word matches this definition?</p>
          <h3 className="mt-3 text-2xl font-semibold leading-relaxed text-slate-900">
            {currentQuestion.prompt}
          </h3>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {currentQuestion.options.map((option) => (
            <AnswerButton
              key={option}
              onClick={() => answer(option)}
              variant="large"
            >
              {option}
            </AnswerButton>
          ))}
        </div>
      </QuestionCard>
    </GameContainer>
  );
}

SpeedRoundGame.static = false;
