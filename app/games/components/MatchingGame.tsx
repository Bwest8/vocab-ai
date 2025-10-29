"use client";

import { useState } from "react";
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

interface GameCard {
  id: string;
  content: string;
  type: "word" | "definition";
  matchId: string;
  wordId: string;
  isMatched: boolean;
}

interface GameSession {
  cards: GameCard[];
  matches: number;
  attempts: number;
  totalPairs: number;
  pointsEarned: number;
}

const shuffle = <T,>(array: T[]) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

type GameState = "intro" | "playing" | "results";

export function MatchingGame({ weeklyWords, reviewWords: _reviewWords, allWords, onResult }: BaseGameProps) {
  void _reviewWords;
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>("intro");
  const [session, setSession] = useState<GameSession | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const gameWords = weeklyWords.length > 0 ? weeklyWords.slice(0, 12) : allWords.slice(0, 12);

  const buildCards = (): GameCard[] => {
    const cards: GameCard[] = [];

    gameWords.forEach((word, index) => {
      cards.push({
        id: `word-${index}`,
        content: word.word,
        type: "word",
        matchId: `match-${index}`,
        wordId: word.id,
        isMatched: false,
      });
      cards.push({
        id: `def-${index}`,
        content: word.teacherDefinition || word.definition,
        type: "definition",
        matchId: `match-${index}`,
        wordId: word.id,
        isMatched: false,
      });
    });

    return shuffle(cards);
  };

  const startGame = () => {
    setSession({
      cards: buildCards(),
      matches: 0,
      attempts: 0,
      totalPairs: gameWords.length,
      pointsEarned: 0,
    });
    setSelectedCards([]);
    setGameState("playing");
  };

  const handleCardClick = (cardId: string) => {
    if (!session || selectedCards.includes(cardId) || selectedCards.length >= 2) return;

    const card = session.cards.find((c) => c.id === cardId);
    if (!card || card.isMatched) return;

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const card1 = session.cards.find((c) => c.id === newSelected[0]);
      const card2 = session.cards.find((c) => c.id === newSelected[1]);

      const newAttempts = session.attempts + 1;

      if (card1 && card2 && card1.matchId === card2.matchId) {
        // Match found!
        const points = 10;
        onResult({
          mode: "matching",
          correct: true,
          pointsAwarded: points,
          wordId: card1.wordId,
        });

        setTimeout(() => {
          const newCards = session.cards.map((c) =>
            c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c
          );
          const newMatches = session.matches + 1;

          setSession({
            ...session,
            cards: newCards,
            matches: newMatches,
            attempts: newAttempts,
            pointsEarned: session.pointsEarned + points,
          });
          setSelectedCards([]);

          if (newMatches === session.totalPairs) {
            // Game complete
            setTimeout(() => setGameState("results"), 500);
          }
        }, 500);
      } else {
        // No match
        onResult({
          mode: "matching",
          correct: false,
          pointsAwarded: 0,
        });

        setSession({
          ...session,
          attempts: newAttempts,
        });

        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const playAgain = () => {
    setSession(null);
    setSelectedCards([]);
    setGameState("intro");
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
          icon="🧩"
          title="Matching Game"
          description="Match vocabulary words with their definitions by clicking pairs of cards. Find all the matches to complete the game!"
          objective="Strengthen word-definition connections through memory and pattern recognition."
          difficulty="Easy"
          questionsCount={gameWords.length}
          onStart={startGame}
          color="pink"
        />
      </GameContainer>
    );
  }

  if (gameState === "results" && session) {
    const percentage = (session.matches / session.totalPairs) * 100;
    const encouragementLevel = session.attempts <= session.totalPairs * 1.5 ? "excellent" : session.attempts <= session.totalPairs * 2 ? "good" : "needs-practice";

    return (
      <GameContainer>
        <GameResults
          icon="🧩"
          title="Matching Game"
          score={session.matches}
          totalQuestions={session.totalPairs}
          pointsEarned={session.pointsEarned}
          wordsToReview={gameWords.map((word) => ({
            word: word.word,
            definition: word.teacherDefinition || word.definition,
            wasCorrect: true, // All matched pairs are correct
          }))}
          onPlayAgain={playAgain}
          onBackToGames={() => router.push("/games")}
          color="pink"
          encouragementLevel={encouragementLevel}
        />
      </GameContainer>
    );
  }

  if (!session) return null;

  return (
    <GameContainer>
      <GameHeader
        icon="🧩"
        title="Matching Game"
        subtitle={`${session.matches} of ${session.totalPairs} matched`}
        color="pink"
        showProgress={false}
        showBack={false}
      />

      {/* Stats Display */}
      <div className="rounded-2xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-6">
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <div className="text-4xl font-extrabold text-pink-600">{session.matches}</div>
            <div className="text-sm font-semibold text-pink-700">Matches</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-rose-600">{session.attempts}</div>
            <div className="text-sm font-semibold text-rose-700">Attempts</div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: session.totalPairs }).map((_, idx) => (
            <div
              key={idx}
              className={`h-3 w-3 rounded-full transition-all ${
                idx < session.matches ? "bg-pink-600 scale-110" : "bg-pink-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Game Board */}
      <div className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {session.cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`rounded-2xl border-2 p-4 md:p-5 text-center transition-all min-h-[100px] md:min-h-[120px] flex items-center justify-center ${
                card.isMatched
                  ? "bg-emerald-100 border-emerald-400 opacity-60"
                  : selectedCards.includes(card.id)
                    ? "bg-pink-200 border-pink-500 scale-105 shadow-lg"
                    : "bg-white border-pink-300 hover:border-pink-500 hover:bg-pink-50 active:scale-95 shadow-sm"
              }`}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched}
            >
              <p
                className={`font-bold leading-snug ${
                  card.type === "word"
                    ? "text-lg md:text-xl text-pink-700"
                    : "text-sm md:text-base text-slate-700"
                }`}
              >
                {card.content}
              </p>
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

MatchingGame.static = false;
