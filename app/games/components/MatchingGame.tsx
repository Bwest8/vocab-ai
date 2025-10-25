"use client";

import { useState } from "react";
import type { WordWithRelations } from "@/lib/study/types";
import type { GameResult } from "@/lib/hooks/useGameProgress";

interface BaseGameProps {
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  allWords: WordWithRelations[];
  onResult: (result: GameResult) => void;
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

export function MatchingGame({ weeklyWords, reviewWords: _reviewWords, allWords, onResult }: BaseGameProps) {
  void _reviewWords;
  const gameWords = weeklyWords.length > 0 ? weeklyWords : allWords.slice(0, 12); // Use weekly words or first 12 from all words

  const buildCards = () => {
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

    return shuffle(gameCards);
  };

  const [cards, setCards] = useState<GameCard[]>(() => buildCards());
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const initializeGame = () => {
    setCards(buildCards());
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
        // Derive the word index from matchId (format: "match-<index>") and map to the underlying word id
        let matchedWordId: string | undefined;
        const parts = (card1.matchId || '').split('-');
        const idx = parts.length === 2 ? parseInt(parts[1], 10) : NaN;
        if (Number.isFinite(idx) && idx >= 0 && idx < gameWords.length) {
          matchedWordId = gameWords[idx].id;
        }

        onResult({
          mode: "matching",
          correct: true,
          pointsAwarded: 10,
          wordId: matchedWordId,
        });
        
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
        onResult({
          mode: "matching",
          correct: false,
          pointsAwarded: 0,
        });
        
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
    <div className="rounded-2xl border border-pink-100 bg-white/95 p-4 md:p-5 shadow-sm">
      {/* Progress Header */}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-pink-50/80 px-4 py-3 border border-pink-200">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🧩</div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-pink-900 leading-tight">Matching Game</h2>
            <p className="text-xs md:text-sm text-pink-600 leading-tight">Match words with definitions</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1">
            {Array.from({ length: gameWords.length }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  idx < matches
                    ? "bg-pink-600"
                    : "bg-pink-200"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-pink-700">
            {matches}/{gameWords.length} matched
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-3 flex items-center justify-center gap-6 text-center">
        <div>
          <div className="text-2xl font-bold text-pink-600 leading-none">{matches}</div>
          <div className="text-xs text-muted-foreground">Matches</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-pink-600 leading-none">{attempts}</div>
          <div className="text-xs text-muted-foreground">Attempts</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`rounded-xl border p-3 md:p-4 text-center transition-all hover:scale-[1.02] min-h-[90px] md:min-h-[110px] ${
              card.isMatched
                ? "bg-pink-100 border-pink-400 opacity-60"
                : selectedCards.includes(card.id)
                  ? "bg-pink-200 border-pink-500 scale-105"
                  : "bg-white border-pink-200 hover:border-pink-400"
            }`}
            onClick={() => handleCardClick(card.id)}
          >
            <p
              className={`font-semibold leading-relaxed ${
                card.type === "word" ? "text-base md:text-lg text-pink-700" : "text-[13px] md:text-sm text-slate-700"
              }`}
            >
              {card.content}
            </p>
          </button>
        ))}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-6">
          <div className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white p-5 text-center">
            <div className="text-3xl mb-1.5">🎉</div>
            <h3 className="text-lg font-bold mb-1">Congratulations!</h3>
            <p className="text-base mb-3">
              You matched all {matches} pairs in {attempts} attempts!
            </p>
            <button
              type="button"
              onClick={initializeGame}
              className="rounded-full bg-white text-pink-600 px-5 py-1.5 font-semibold hover:bg-pink-50 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

MatchingGame.static = false;