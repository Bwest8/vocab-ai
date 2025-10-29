"use client";

import { useCallback, useEffect, useState } from "react";

export interface WordProgressStats {
  wordId: string;
  word: string;
  definition: string;
  masteryLevel: number;
  correctCount: number;
  incorrectCount: number;
  totalAttempts: number;
  accuracy: number;
  lastStudied: Date | null;
}

interface UseWordProgressState {
  words: WordProgressStats[];
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_PROFILE_KEY = "default";

export function useWordProgress(vocabSetId: string | null | undefined) {
  const [state, setState] = useState<UseWordProgressState>({
    words: [],
    isLoading: false,
    error: null,
  });

  const fetchWordProgress = useCallback(async () => {
    if (!vocabSetId) {
      setState({
        words: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        vocabSetId,
        profileKey: DEFAULT_PROFILE_KEY
      });
      const response = await fetch(`/api/games/word-progress?${params.toString()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to load word progress");
      }

      const data = await response.json();
      setState({
        words: data.words,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching word progress", error);
      setState({
        words: [],
        isLoading: false,
        error: error instanceof Error ? error.message : "Unable to load word progress",
      });
    }
  }, [vocabSetId]);

  useEffect(() => {
    void fetchWordProgress();
  }, [fetchWordProgress]);

  return {
    words: state.words,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchWordProgress,
  };
}
