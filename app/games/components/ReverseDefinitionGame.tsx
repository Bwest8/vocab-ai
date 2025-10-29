"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { WordWithRelations } from "@/lib/study/types";
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

interface GameSession {
  questions: Array<{
    id: string;
    word: string;
    definition: string;
    options: string[];
  }>;
  results: Array<{ wordId: string; word: string; definition: string; correct: boolean }>;
  currentIndex: number;
  score: number;
  pointsEarned: number;
}

const QUESTIONS_PER_SESSION = 10;
const POINTS_PER_CORRECT = 12;

const shuffle = <T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

type GameState = "intro" | "playing" | "results";

export function ReverseDefinitionGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const shuffledWords = useMemo(() => shuffle([...weeklyWords]).slice(0, QUESTIONS_PER_SESSION), [weeklyWords]);

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
        word: word.word,
        definition: word.teacherDefinition || word.definition,
        options,
      };
    });
  }, [shuffledWords, optionPool]);

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
    const correct = option === currentQuestion.definition;

    setFeedback({
      correct,
      message: correct ? "" : `The correct answer was "${currentQuestion.definition}".`,
    });

    const points = correct ? POINTS_PER_CORRECT : 0;

    onResult({
      mode: "reverse-definition",
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
          icon="🔄"
          title="Reverse Definition"
          description="See the vocabulary word and choose the correct definition from four options."
          objective="Strengthen your understanding by matching words to their meanings."
          difficulty="Medium"
          questionsCount={questions.length}
          onStart={startGame}
          color="purple"
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
          icon="🔄"
          title="Reverse Definition"
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
          color="purple"
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
        icon="🔄"
        title="Reverse Definition"
        subtitle="Choose the correct definition"
        currentQuestion={session.currentIndex + 1}
        totalQuestions={session.questions.length}
        color="purple"
        showProgress={true}
        showBack={false}
      />

      <QuestionCard showSkip={!selectedOption} onSkip={skip}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-purple-600">Word</p>
          <h3 className="mt-3 text-4xl font-extrabold text-slate-900">
            {currentQuestion.word}
          </h3>
        </div>

        <div className="mt-8 grid gap-4">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.definition;
            const showCorrect = selectedOption !== null && isCorrect;
            const showWrong = isSelected && !isCorrect;

            return (
              <AnswerButton
                key={option}
                onClick={() => selectOption(option)}
                isSelected={isSelected}
                isCorrect={showCorrect}
                isWrong={showWrong}
                disabled={selectedOption !== null}
                variant="large"
              >
                {option}
              </AnswerButton>
            );
          })}
        </div>
      </QuestionCard>

      {feedback && (
        <FeedbackMessage
          isCorrect={feedback.correct}
          message={feedback.message}
          word={currentQuestion.word}
          definition={currentQuestion.definition}
          showContext={true}
        />
      )}
    </GameContainer>
  );
}

ReverseDefinitionGame.static = false;