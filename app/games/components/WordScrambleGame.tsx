"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";
import type { GameMode } from "@/lib/types";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
}

const MODE: GameMode = "word-scramble";
const POINTS = 11; // between definition-match (10) and reverse-definition (12)

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

export function WordScrambleGame({ weeklyWords, allWords, onResult }: BaseGameProps) {
  const [words, setWords] = useState<WordWithRelations[]>(() => {
    const pool = weeklyWords.length > 0 ? weeklyWords : allWords.slice(0, 10);
    return shuffle(pool);
  });

  const [index, setIndex] = useState(0);
  const initialWord = words[0];
  const [scrambled, setScrambled] = useState<string>(() => generateScramble(initialWord?.word ?? ""));
  const [answer, setAnswer] = useState<string>("");
  // Track which scrambled letters have been used (by index)
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [hintStep, setHintStep] = useState(0); // 0 none, 1 masked def, 2 masked example
  const [revealFirst, setRevealFirst] = useState(false);
  const [revealLast, setRevealLast] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);

  const current = words[index];

  const prepareWord = (word: WordWithRelations | undefined) => {
    if (!word) {
      setScrambled("");
      setAnswer("");
      setUsedIndices([]);
      setHintStep(0);
      setRevealFirst(false);
      setRevealLast(false);
      setIsCorrect(null);
      setAnimatingIdx(null);
      return;
    }

    setScrambled(generateScramble(word.word));
    setAnswer("");
    setUsedIndices([]);
    setHintStep(0);
    setRevealFirst(false);
    setRevealLast(false);
    setIsCorrect(null);
    setAnimatingIdx(null);
  };

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

  const submit = () => {
    if (!current) return;
    const correct = answer.trim().toLowerCase() === current.word.toLowerCase();
    setIsCorrect(correct);
    // Simple penalty system for hints
    const penalty = (hintStep >= 1 ? 2 : 0) + (hintStep >= 2 ? 1 : 0) + (revealFirst ? 1 : 0) + (revealLast ? 1 : 0);
    const awarded = Math.max(1, POINTS - penalty);
  onResult({ mode: MODE, correct, pointsAwarded: correct ? awarded : 0, wordId: current.id });

    if (correct) {
      setScore((s) => s + 1);
      setTimeout(() => {
        if (index < words.length - 1) {
          const nextIndex = index + 1;
          setIndex(nextIndex);
          prepareWord(words[nextIndex]);
        } else {
          setIsComplete(true);
        }
      }, 900);
    }
  };
  // Handle clicking a letter box to add to answer
  function handleLetterClick(idx: number) {
    if (usedIndices.includes(idx) || isCorrect === true) return;
    setAnswer((prev) => prev + scrambled[idx]);
    setUsedIndices((prev) => [...prev, idx]);
    setAnimatingIdx(idx);
    setTimeout(() => setAnimatingIdx(null), 220); // Animation duration
  }

  // Handle removing last letter (backspace)
  function handleRemoveLast() {
    if (answer.length === 0 || isCorrect === true) return;
    // Remove last used index
    setUsedIndices((prev) => prev.slice(0, -1));
    setAnswer((prev) => prev.slice(0, -1));
  }

  const skip = () => {
    if (index < words.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      prepareWord(words[nextIndex]);
    } else {
      setIsComplete(true);
    }
  };

  const reset = () => {
    const pool = weeklyWords.length > 0 ? weeklyWords : allWords.slice(0, 10);
    const nextWords = shuffle(pool);
    setWords(nextWords);
    setIndex(0);
    setScore(0);
    setIsComplete(false);
    prepareWord(nextWords[0]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && answer && !isCorrect) submit();
    if (e.key === "Backspace") handleRemoveLast();
  };

  if (words.length === 0 || !current) {
    return <div className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">Add some words to this set to unlock the games!</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border-4 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 md:p-12 shadow-xl backdrop-blur-lg min-h-[80svh] flex flex-col justify-center items-center">
      {/* Playful Header / Controls */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="flex flex-col items-start gap-2">
          <div className="text-lg md:text-xl font-bold text-indigo-700 tracking-wide">Word <span className="text-indigo-500">{index + 1}</span> of <span className="text-indigo-500">{words.length}</span></div>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-purple-600">Score: <span className="text-purple-700">{score}</span></span>
            <button type="button" onClick={reset} className="rounded-full border-2 border-indigo-300 bg-white px-4 py-1.5 font-bold text-indigo-700 shadow hover:bg-indigo-50 hover:border-indigo-400 transition">New Game</button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-base font-semibold text-slate-500 italic">Vocab Scramble</span>
        </div>
      </div>

      {/* Definition area - vibrant and engaging */}
      <div className="w-full mb-6 text-center">
        <h3 className="text-2xl md:text-3xl font-extrabold mb-2 text-indigo-700 drop-shadow">Unscramble this word</h3>
        <div className="text-xl md:text-2xl font-bold text-purple-700 mb-2 bg-purple-50 rounded-xl py-2 px-4 inline-block shadow">
          {current.teacherDefinition || current.definition}
        </div>
        <div className="text-sm md:text-base text-slate-500 flex items-center justify-center gap-4 mt-2">
          {current.partOfSpeech && <span className="italic">{current.partOfSpeech}</span>}
          <span>Length: <span className="font-bold text-indigo-600">{current.word.length}</span></span>
          {(revealFirst || revealLast) && <span className="font-semibold text-slate-700">Pattern: {pattern}</span>}
        </div>
      </div>

      {/* Scrambled letters - large, spaced, animated */}
      <div className="w-full flex flex-col items-center mb-6">
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          {scrambled.split("").map((letter, i) => {
            const used = usedIndices.includes(i);
            const animating = animatingIdx === i;
            return (
              <button
                key={`${letter}-${i}`}
                type="button"
                onClick={() => handleLetterClick(i)}
                disabled={used || isCorrect === true}
                className={`w-16 h-16 md:w-20 md:h-20 border-4 rounded-2xl flex items-center justify-center transition-all duration-200 font-extrabold text-3xl md:text-4xl
                  ${used ? "bg-gray-200 border-gray-300 text-gray-400" : "bg-indigo-100 border-indigo-400 text-indigo-700 hover:bg-indigo-200 hover:border-indigo-500"}
                  ${isCorrect === true ? "opacity-60" : "cursor-pointer"}
                  ${animating ? "scale-110 bg-emerald-100 border-emerald-400 shadow-xl" : ""}`}
                style={{ zIndex: animating ? 2 : 1 }}
              >
                <span className={`text-3xl md:text-4xl font-extrabold uppercase ${animating ? "text-emerald-700" : ""}`}>{letter}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => {
              if (!current) return;
              const letters = current.word.split("");
              let next = scrambled;
              for (let t = 0; t < 5 && next === scrambled && letters.length > 1; t += 1) {
                next = shuffle(letters).join("");
              }
              // Update usedIndices to match new positions
              const oldPositions = new Map<string, number[]>();
              scrambled.split("").forEach((letter, idx) => {
                if (!oldPositions.has(letter)) oldPositions.set(letter, []);
                oldPositions.get(letter)!.push(idx);
              });
              const newPositions = new Map<string, number[]>();
              next.split("").forEach((letter, idx) => {
                if (!newPositions.has(letter)) newPositions.set(letter, []);
                newPositions.get(letter)!.push(idx);
              });
              const newUsedIndices: number[] = [];
              for (const [letter, oldPos] of oldPositions) {
                const usedForLetter = usedIndices.filter(idx => oldPos.includes(idx)).sort((a, b) => a - b);
                const newPos = newPositions.get(letter)!;
                usedForLetter.forEach((_, i) => {
                  newUsedIndices.push(newPos[i]);
                });
              }
              setScrambled(next);
              setUsedIndices(newUsedIndices);
            }}
            className="rounded-full border-2 border-indigo-300 bg-white px-4 py-2 text-base font-bold text-indigo-700 shadow hover:bg-indigo-50 hover:border-indigo-400 transition"
          >
            Reshuffle
          </button>
          <button
            type="button"
            onClick={() => setRevealFirst(true)}
            disabled={revealFirst}
            className="rounded-full border-2 border-emerald-300 bg-white px-4 py-2 text-base font-bold text-emerald-700 shadow hover:bg-emerald-50 hover:border-emerald-400 transition disabled:opacity-60"
          >
            Reveal first letter
          </button>
          <button
            type="button"
            onClick={() => setRevealLast(true)}
            disabled={revealLast}
            className="rounded-full border-2 border-emerald-300 bg-white px-4 py-2 text-base font-bold text-emerald-700 shadow hover:bg-emerald-50 hover:border-emerald-400 transition disabled:opacity-60"
          >
            Reveal last letter
          </button>
        </div>
      </div>

      {/* Input - show answer and allow backspace, playful */}
      <div className="w-full flex items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Type your answer or tap letters..."
          value={answer}
          onChange={(e) => {
            if (isCorrect === true) return;
            setAnswer(e.target.value);
            setUsedIndices([]);
          }}
          onKeyDown={onKey}
          className="w-full h-16 md:h-20 rounded-2xl border-4 border-indigo-200 bg-white/90 px-6 text-center text-2xl md:text-3xl font-extrabold outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          disabled={isCorrect === true}
        />
        <button
          type="button"
          onClick={handleRemoveLast}
          disabled={answer.length === 0 || isCorrect === true}
          className="rounded-full border-2 border-rose-300 bg-white px-4 py-2 text-xl font-bold text-rose-700 shadow hover:bg-rose-50 hover:border-rose-400 transition disabled:opacity-60"
        >
          ⌫
        </button>
      </div>

      {/* Feedback - playful and positive */}
      {isCorrect === true && (
        <div className="mb-4 rounded-2xl border-4 border-emerald-400 bg-emerald-50 px-6 py-5 text-center shadow-lg">
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-700">Correct! Great job! 🎉</p>
        </div>
      )}
      {isCorrect === false && (
        <div className="mb-4 rounded-2xl border-4 border-rose-400 bg-rose-50 px-6 py-5 text-center shadow-lg">
          <p className="text-2xl md:text-3xl font-extrabold text-rose-600">Not quite. Try again!</p>
        </div>
      )}

      {/* Controls - big, friendly buttons */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <button
          type="button"
          onClick={submit}
          disabled={!answer || isCorrect === true}
          className="rounded-2xl border-4 border-indigo-400 bg-indigo-600 px-6 py-5 text-xl font-extrabold text-white shadow hover:bg-indigo-500 transition disabled:opacity-60"
        >
          Check Answer
        </button>
        <button
          type="button"
          onClick={skip}
          className="rounded-2xl border-4 border-slate-200 bg-white px-6 py-5 text-xl font-extrabold text-slate-700 shadow hover:border-slate-300 transition"
        >
          Skip
        </button>
      </div>

      {/* Completion - fun celebration */}
      {isComplete && (
        <div className="mt-8 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-10 text-center shadow-xl">
          <div className="text-5xl mb-2">🏆</div>
          <h3 className="text-3xl font-extrabold mb-2">Game Complete!</h3>
          <p className="text-xl mb-4">You got <span className="font-bold">{score}</span> out of <span className="font-bold">{words.length}</span> words correct!</p>
          <button type="button" onClick={reset} className="rounded-full bg-white text-indigo-700 px-8 py-3 text-xl font-extrabold shadow hover:bg-indigo-50 transition">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

WordScrambleGame.static = false;
