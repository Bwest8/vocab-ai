"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameMode, GameProfileResponse, GameResultPayload, ModeStats as SharedModeStats } from "@/lib/games/types";

const GAME_MODES: GameMode[] = [
  "definition-match",
  "reverse-definition",
  "fill-in-the-blank",
  "speed-round",
  "spelling",
  "example-sentence",
];

const COMPLETION_THRESHOLD = 3;
const DEFAULT_PROFILE_KEY = "default"; // reserved for future multi-user support

const createInitialModeStats = (): Record<GameMode, SharedModeStats> => ({
  "definition-match": { attempted: 0, correct: 0 },
  "reverse-definition": { attempted: 0, correct: 0 },
  "fill-in-the-blank": { attempted: 0, correct: 0 },
  "speed-round": { attempted: 0, correct: 0 },
  spelling: { attempted: 0, correct: 0 },
  "example-sentence": { attempted: 0, correct: 0 },
});

export type ModeStats = SharedModeStats;
export interface GameResult extends GameResultPayload {}

interface UseGameProgressState {
  points: number;
  questionsAttempted: number;
  questionsCorrect: number;
  combo: number;
  bestCombo: number;
  streak: number;
  modeStats: Record<GameMode, ModeStats>;
  completedModes: Set<GameMode>;
  isLoading: boolean;
  error: string | null;
}

const parseProfileResponse = (data: GameProfileResponse) => {
  const points = data.profile.points ?? 0;
  const questionsAttempted = data.profile.questionsAttempted ?? 0;
  const questionsCorrect = data.profile.questionsCorrect ?? 0;
  const combo = data.profile.currentCombo ?? 0;
  const bestCombo = data.profile.bestCombo ?? 0;
  const streak = data.profile.streak ?? 0;

  const modeStats = createInitialModeStats();
  data.modeProgress.forEach((record) => {
    if (GAME_MODES.includes(record.mode as GameMode)) {
      modeStats[record.mode as GameMode] = {
        attempted: record.attempted ?? 0,
        correct: record.correct ?? 0,
      };
    }
  });

  const completedModes = new Set<GameMode>();
  GAME_MODES.forEach((mode) => {
    if (modeStats[mode].correct >= COMPLETION_THRESHOLD) {
      completedModes.add(mode);
    }
  });

  return {
    points,
    questionsAttempted,
    questionsCorrect,
    combo,
    bestCombo,
    streak,
    modeStats,
    completedModes,
  } as const;
};

export function useGameProgress(vocabSetId: string | null | undefined) {
  const [state, setState] = useState<UseGameProgressState>(() => ({
    points: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    combo: 0,
    bestCombo: 0,
    streak: 0,
    modeStats: createInitialModeStats(),
    completedModes: new Set(),
    isLoading: false,
    error: null,
  }));

  const hydrateFromResponse = useCallback((data: GameProfileResponse) => {
    const parsed = parseProfileResponse(data);

    setState((prev) => ({
      ...prev,
      points: parsed.points,
      questionsAttempted: parsed.questionsAttempted,
      questionsCorrect: parsed.questionsCorrect,
      combo: parsed.combo,
      bestCombo: parsed.bestCombo,
      streak: parsed.streak,
      modeStats: parsed.modeStats,
      completedModes: parsed.completedModes,
      error: null,
    }));
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!vocabSetId) {
      setState((prev) => ({
        ...prev,
        modeStats: createInitialModeStats(),
        completedModes: new Set(),
        isLoading: false,
        error: null,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({ setId: vocabSetId, profileKey: DEFAULT_PROFILE_KEY });
      const response = await fetch(`/api/games/profile?${params.toString()}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to load game progress");
      }

      const data = (await response.json()) as GameProfileResponse;
      hydrateFromResponse(data);
    } catch (error) {
      console.error("Error fetching game progress", error);
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : "Unable to load game progress" }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [hydrateFromResponse, vocabSetId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const registerResult = useCallback(
    async (result: GameResult) => {
      if (!vocabSetId) {
        console.warn("No active vocab set selected; skipping progress update");
        return;
      }

      try {
        const response = await fetch("/api/games/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vocabSetId,
            ...result,
            pointsAwarded: Math.max(0, Math.round(result.pointsAwarded ?? 0)),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to record game progress");
        }

        const data = (await response.json()) as GameProfileResponse;
        hydrateFromResponse(data);
      } catch (error) {
        console.error("Error saving game progress", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unable to save game progress",
        }));
      }
    },
    [hydrateFromResponse, vocabSetId]
  );

  const { points, questionsAttempted, questionsCorrect, combo, bestCombo, streak, modeStats, completedModes, isLoading, error } = state;

  const accuracy = useMemo(() => {
    if (questionsAttempted === 0) return 0;
    return (questionsCorrect / questionsAttempted) * 100;
  }, [questionsAttempted, questionsCorrect]);

  const stars = useMemo(() => Math.floor(points / 100), [points]);

  return {
    points,
    stars,
    accuracy,
    combo,
    bestCombo,
    streak,
    modeStats,
    completedModes,
    questionsAttempted,
    questionsCorrect,
    isLoading,
    error,
    registerResult,
    refresh: fetchProfile,
  } as const;
}
