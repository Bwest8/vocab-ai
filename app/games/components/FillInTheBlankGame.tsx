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
    sentence: string;
    correct: string;
    definition: string;
    options: string[];
  }>;
  results: Array<{ wordId: string; word: string; definition: string; correct: boolean }>;
  currentIndex: number;
  score: number;
  pointsEarned: number;
}

const QUESTIONS_PER_SESSION = 10;
const POINTS_PER_CORRECT = 14;

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

type GameState = "intro" | "playing" | "results";

export function FillInTheBlankGame({ weeklyWords, reviewWords, allWords, onResult }: BaseGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [session, setSession] = useState<GameSession | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const shuffledWords = useMemo(() => shuffle([...weeklyWords]).slice(0, QUESTIONS_PER_SESSION), [weeklyWords]);
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
        definition: word.teacherDefinition || word.definition,
        options: shuffle([word.word, ...otherOptions]),
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

  const choose = (option: string) => {
    if (!session || selected) return;

    const currentQuestion = session.questions[session.currentIndex];
    setSelected(option);
    const correct = option === currentQuestion.correct;

    setFeedback({
      correct,
      message: correct ? "" : `The correct word is "${currentQuestion.correct}".`,
    });

    const points = correct ? POINTS_PER_CORRECT : 0;

    onResult({
      mode: "fill-in-the-blank",
      correct,
      pointsAwarded: points,
      wordId: currentQuestion.id,
    });

    const newResults = [
      ...session.results,
      {
        wordId: currentQuestion.id,
        word: currentQuestion.correct,
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
      setSelected(null);
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
    setSelected(null);
    setFeedback(null);

    if (session.currentIndex + 1 >= session.questions.length) {
      setGameState("results");
    } else {
      setSession({ ...session, currentIndex: session.currentIndex + 1 });
    }
  };

  const playAgain = () => {
    setSession(null);
    setSelected(null);
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
          icon="✍️"
          title="Fill in the Blank"
          description="Read the sentence and choose the vocabulary word that best completes it."
          objective="Apply vocabulary words in context by selecting the best fit for each sentence."
          difficulty="Medium"
          questionsCount={questions.length}
          onStart={startGame}
          color="emerald"
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
          icon="✍️"
          title="Fill in the Blank"
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
          color="emerald"
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
        icon="✍️"
        title="Fill in the Blank"
        subtitle="Choose the word that fits"
        currentQuestion={session.currentIndex + 1}
        totalQuestions={session.questions.length}
        color="emerald"
        showProgress={true}
        showBack={false}
      />

      <QuestionCard showSkip={!selected} onSkip={skip}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">Complete the Sentence</p>
          <p className="mt-3 text-2xl font-medium leading-relaxed text-slate-900">
            {currentQuestion.sentence}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {currentQuestion.options.map((option) => {
            const isSelected = selected === option;
            const isCorrect = option === currentQuestion.correct;
            const showCorrect = selected !== null && isCorrect;
            const showWrong = isSelected && !isCorrect;

            return (
              <AnswerButton
                key={option}
                onClick={() => choose(option)}
                isSelected={isSelected}
                isCorrect={showCorrect}
                isWrong={showWrong}
                disabled={selected !== null}
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
          word={currentQuestion.correct}
          definition={currentQuestion.definition}
          showContext={true}
        />
      )}
    </GameContainer>
  );
}

FillInTheBlankGame.static = false;
