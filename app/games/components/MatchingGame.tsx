"use client";

import { useState, useEffect } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
  gameKey: number;
}

interface GameCard {
  id: string;
  content: string;
  type: "word" | "definition";
  matchId: string;
  isMatched: boolean;
}

const shuffle = <T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function MatchingGame({ weeklyWords, reviewWords, allWords, onResult, gameKey }: BaseGameProps) {
  const gameWords = weeklyWords.length > 0 ? weeklyWords : allWords.slice(0, 12); // Use weekly words or first 12 from all words

  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (gameWords.length > 0) {
      initializeGame();
    }
  }, [gameWords, gameKey]);

  const initializeGame = () => {
    const gameCards: GameCard[] = [];

    gameWords.forEach((word, index) => {
      gameCards.push({
        id: `word-${index}`,
        content: word.word,
        type: "word",
        matchId: `match-${index}`,
        isMatched: false,
      });
      gameCards.push({
        id: `def-${index}`,
        content: word.teacherDefinition || word.definition,
        type: "definition",
        matchId: `match-${index}`,
        isMatched: false,
      });
    });

    setCards(shuffle(gameCards));
    setSelectedCards([]);
    setMatches(0);
    setAttempts(0);
    setIsComplete(false);
  };

  const handleCardClick = (cardId: string) => {
    if (selectedCards.includes(cardId)) return;
    if (selectedCards.length >= 2) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isMatched) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setAttempts(attempts + 1);
      const card1 = cards.find((c) => c.id === newSelected[0]);
      const card2 = cards.find((c) => c.id === newSelected[1]);

      if (card1 && card2 && card1.matchId === card2.matchId) {
        // Match found!
        setTimeout(() => {
          setCards(cards.map((c) => (c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c)));
          setMatches(matches + 1);
          setSelectedCards([]);

          if (matches + 1 === gameWords.length) {
            setIsComplete(true);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  if (gameWords.length === 0) {
    return (
      <div className="rounded-2xl bg-white/80 p-6 text-center text-sm text-slate-500">
        Add some words to this set to unlock the matching game!
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-md shadow-pink-100/70 backdrop-blur-sm">
      {/* Progress Header */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-pink-50 px-5 py-4 border border-pink-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🧩</div>
          <div>
            <h2 className="text-lg font-bold text-pink-900">Matching Game</h2>
            <p className="text-sm text-pink-600">Match words with definitions</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: gameWords.length }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx < matches
                    ? "bg-pink-600"
                    : "bg-pink-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-pink-700">
            {matches}/{gameWords.length} matched
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center justify-center gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-pink-600">{matches}</div>
          <div className="text-sm text-muted-foreground">Matches</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-pink-600">{attempts}</div>
          <div className="text-sm text-muted-foreground">Attempts</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`rounded-2xl border p-4 text-center transition-all hover:scale-105 min-h-[100px] md:min-h-[120px] ${
              card.isMatched
                ? "bg-pink-100 border-pink-400 opacity-50"
                : selectedCards.includes(card.id)
                  ? "bg-pink-200 border-pink-500 scale-105"
                  : "bg-white border-pink-200 hover:border-pink-400"
            }`}
            onClick={() => handleCardClick(card.id)}
          >
            <p
              className={`font-semibold leading-relaxed ${
                card.type === "word" ? "text-lg md:text-xl text-pink-700" : "text-sm md:text-base text-slate-700"
              }`}
            >
              {card.content}
            </p>
          </button>
        ))}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-8">
          <div className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
            <p className="text-lg mb-4">
              You matched all {matches} pairs in {attempts} attempts!
            </p>
            <button
              type="button"
              onClick={initializeGame}
              className="rounded-full bg-white text-pink-600 px-6 py-2 font-semibold hover:bg-pink-50 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}