"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";
import {
  GameHeader,
  GameContainer,
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
  words: WordWithRelations[];
  currentIndex: number;
  score: number;
  pointsEarned: number;
  results: Array<{ wordId: string; word: string; definition: string; correct: boolean }>;
}

const QUESTIONS_PER_SESSION = 10;
const BASE_POINTS = 11;

const shuffle = <T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const generateScramble = (word: string): string => {
  if (!word) return "";
  const letters = word.split("");
  let scrambledWord = word;

  for (let attempts = 0; attempts < 5 && scrambledWord === word && letters.length > 1; attempts += 1) {
    scrambledWord = shuffle(letters).join("");
  }

  return scrambledWord;
};

type GameState = "intro" | "playing" | "results";

export function WordScrambleGame({ weeklyWords, allWords, onResult }: BaseGameProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [session, setSession] = useState<GameSession | null>(null);

  // Current word state
  const [scrambled, setScrambled] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [revealFirst, setRevealFirst] = useState(false);
  const [revealLast, setRevealLast] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);

  const gameWords = useMemo(() => {
    const pool = weeklyWords.length > 0 ? weeklyWords : allWords.slice(0, QUESTIONS_PER_SESSION);
    return shuffle(pool).slice(0, QUESTIONS_PER_SESSION);
  }, [weeklyWords, allWords]);

  const current = session?.words[session.currentIndex];

  const pattern = useMemo(() => {
    if (!current) return "";
    const w = current.word;
    return w
      .split("")
      .map((ch, i) => {
        if ((i === 0 && revealFirst) || (i === w.length - 1 && revealLast)) return ch.toUpperCase();
        return "_";
      })
      .join(" ");
  }, [current, revealFirst, revealLast]);

  const startGame = () => {
    const words = gameWords;
    setSession({
      words,
      currentIndex: 0,
      score: 0,
      pointsEarned: 0,
      results: [],
    });
    setScrambled(generateScramble(words[0]?.word ?? ""));
    setAnswer("");
    setUsedIndices([]);
    setHintStep(0);
    setRevealFirst(false);
    setRevealLast(false);
    setIsCorrect(null);
    setAnimatingIdx(null);
    setGameState("playing");
  };

  const prepareNextWord = (nextIndex: number) => {
    if (!session) return;

    const nextWord = session.words[nextIndex];
    setScrambled(generateScramble(nextWord?.word ?? ""));
    setAnswer("");
    setUsedIndices([]);
    setHintStep(0);
    setRevealFirst(false);
    setRevealLast(false);
    setIsCorrect(null);
    setAnimatingIdx(null);
  };

  const submit = () => {
    if (!current || !session) return;

    const correct = answer.trim().toLowerCase() === current.word.toLowerCase();
    setIsCorrect(correct);

    // Penalty system for hints
    const penalty = (hintStep >= 1 ? 2 : 0) + (hintStep >= 2 ? 1 : 0) + (revealFirst ? 1 : 0) + (revealLast ? 1 : 0);
    const awarded = Math.max(1, BASE_POINTS - penalty);

    onResult({
      mode: "word-scramble",
      correct,
      pointsAwarded: correct ? awarded : 0,
      wordId: current.id,
    });

    const newResults = [
      ...session.results,
      {
        wordId: current.id,
        word: current.word,
        definition: current.teacherDefinition || current.definition,
        correct,
      },
    ];

    const newSession = {
      ...session,
      results: newResults,
      score: session.score + (correct ? 1 : 0),
      pointsEarned: session.pointsEarned + (correct ? awarded : 0),
    };

    if (correct) {
      setTimeout(() => {
        if (session.currentIndex < session.words.length - 1) {
          const nextIndex = session.currentIndex + 1;
          setSession({ ...newSession, currentIndex: nextIndex });
          prepareNextWord(nextIndex);
        } else {
          setSession(newSession);
          setGameState("results");
        }
      }, 1500);
    } else {
      setSession(newSession);
    }
  };

  const handleLetterClick = (idx: number) => {
    if (usedIndices.includes(idx) || isCorrect === true) return;
    setAnswer((prev) => prev + scrambled[idx]);
    setUsedIndices((prev) => [...prev, idx]);
    setAnimatingIdx(idx);
    setTimeout(() => setAnimatingIdx(null), 220);
  };

  const handleRemoveLast = () => {
    if (answer.length === 0 || isCorrect === true) return;
    setUsedIndices((prev) => prev.slice(0, -1));
    setAnswer((prev) => prev.slice(0, -1));
  };

  const skip = () => {
    if (!session) return;

    if (session.currentIndex < session.words.length - 1) {
      const nextIndex = session.currentIndex + 1;
      setSession({ ...session, currentIndex: nextIndex });
      prepareNextWord(nextIndex);
    } else {
      setGameState("results");
    }
  };

  const playAgain = () => {
    setSession(null);
    setGameState("intro");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && answer && !isCorrect) submit();
    if (e.key === "Backspace") handleRemoveLast();
  };

  if (gameWords.length === 0) {
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
          icon="🔤"
          title="Word Scramble"
          description="Unscramble the letters to reveal the vocabulary word! Click letters or type your answer. Use hints if you need help."
          objective="Improve spelling and word recognition by unscrambling vocabulary words."
          difficulty="Medium"
          questionsCount={gameWords.length}
          onStart={startGame}
          color="blue"
        />
      </GameContainer>
    );
  }

  if (gameState === "results" && session) {
    const percentage = (session.score / session.words.length) * 100;
    const encouragementLevel = percentage >= 80 ? "excellent" : percentage >= 60 ? "good" : "needs-practice";

    return (
      <GameContainer>
        <GameResults
          icon="🔤"
          title="Word Scramble"
          score={session.score}
          totalQuestions={session.words.length}
          pointsEarned={session.pointsEarned}
          wordsToReview={session.results.map((r) => ({
            word: r.word,
            definition: r.definition,
            wasCorrect: r.correct,
          }))}
          onPlayAgain={playAgain}
          onBackToGames={() => router.push("/games")}
          color="blue"
          encouragementLevel={encouragementLevel}
        />
      </GameContainer>
    );
  }

  if (!session || !current) return null;

  return (
    <GameContainer>
      <GameHeader
        icon="🔤"
        title="Word Scramble"
        subtitle="Unscramble the word"
        currentQuestion={session.currentIndex + 1}
        totalQuestions={session.words.length}
        color="blue"
        showProgress={true}
        showBack={false}
      />

      {/* Definition Card */}
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">Definition</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-900">
          {current.teacherDefinition || current.definition}
        </h3>
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
          {current.partOfSpeech && <span className="font-semibold italic">{current.partOfSpeech}</span>}
          <span>Length: <span className="font-bold text-blue-600">{current.word.length} letters</span></span>
          {(revealFirst || revealLast) && (
            <span className="font-bold text-slate-700">Pattern: <span className="font-mono text-blue-600">{pattern}</span></span>
          )}
        </div>
      </div>

      {/* Scrambled Letters */}
      <div className="rounded-2xl border border-white/80 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
        <p className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-blue-600">
          Click letters to build your answer
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {scrambled.split("").map((letter, i) => {
            const used = usedIndices.includes(i);
            const animating = animatingIdx === i;
            return (
              <button
                key={`${letter}-${i}`}
                type="button"
                onClick={() => handleLetterClick(i)}
                disabled={used || isCorrect === true}
                className={`h-16 w-16 md:h-20 md:w-20 rounded-2xl border-4 font-extrabold text-3xl md:text-4xl transition-all ${
                  used
                    ? "border-slate-300 bg-slate-100 text-slate-400"
                    : animating
                      ? "scale-110 border-emerald-500 bg-emerald-100 text-emerald-700 shadow-xl"
                      : "border-blue-400 bg-blue-100 text-blue-700 hover:border-blue-500 hover:bg-blue-200 active:scale-95"
                }`}
              >
                <span className="uppercase">{letter}</span>
              </button>
            );
          })}
        </div>

        {/* Hint Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRevealFirst(true)}
            disabled={revealFirst}
            className="rounded-full border-2 border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
          >
            Reveal First
          </button>
          <button
            type="button"
            onClick={() => setRevealLast(true)}
            disabled={revealLast}
            className="rounded-full border-2 border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
          >
            Reveal Last
          </button>
          <button
            type="button"
            onClick={() => {
              if (!current) return;
              const letters = current.word.split("");
              let next = scrambled;
              for (let t = 0; t < 5 && next === scrambled && letters.length > 1; t += 1) {
                next = shuffle(letters).join("");
              }
              setScrambled(next);
              setUsedIndices([]);
              setAnswer("");
            }}
            className="rounded-full border-2 border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm hover:bg-blue-50"
          >
            Reshuffle
          </button>
        </div>

        {/* Answer Input */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Your answer..."
            value={answer}
            onChange={(e) => {
              if (isCorrect === true) return;
              setAnswer(e.target.value);
              setUsedIndices([]);
            }}
            onKeyDown={onKey}
            className="h-16 flex-1 rounded-2xl border-4 border-blue-200 bg-white px-6 text-center text-2xl font-bold outline-none transition focus:border-blue-400"
            disabled={isCorrect === true}
          />
          <button
            type="button"
            onClick={handleRemoveLast}
            disabled={answer.length === 0 || isCorrect === true}
            className="h-16 w-16 rounded-2xl border-2 border-rose-300 bg-white text-2xl font-bold text-rose-700 shadow-sm hover:bg-rose-50 disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        {/* Feedback */}
        {isCorrect === true && (
          <div className="mt-4 rounded-2xl border-4 border-emerald-400 bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-700">Correct! Excellent work! 🎉</p>
          </div>
        )}
        {isCorrect === false && (
          <div className="mt-4 rounded-2xl border-4 border-rose-400 bg-rose-50 p-4 text-center">
            <p className="text-2xl font-extrabold text-rose-600">Not quite. Try again!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={submit}
            disabled={!answer || isCorrect === true}
            className="rounded-2xl border-4 border-blue-500 bg-blue-600 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
          >
            Check Answer
          </button>
          <button
            type="button"
            onClick={skip}
            className="rounded-2xl border-4 border-slate-300 bg-white py-4 text-xl font-bold text-slate-700 shadow-lg transition hover:bg-slate-50"
          >
            Skip
          </button>
        </div>
      </div>
    </GameContainer>
  );
}

WordScrambleGame.static = false;
