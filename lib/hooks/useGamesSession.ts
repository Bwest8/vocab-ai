"use client";

import { useEffect, useMemo, useState } from "react";
import { toMasteryLevel } from "@/lib/study/utils";
import type { FetchState, VocabSetSummary, WordWithRelations } from "@/lib/study/types";
import type { MasteryLevel } from "@/lib/types";
import type { GameMode } from "@/lib/types";

const WEEKLY_WORD_LIMIT = 12;

export interface WeeklyMasterySummary {
  averageLevel: number;
  masteredCount: number;
  needsReviewCount: number;
  levelDistribution: Record<MasteryLevel, number>;
}

interface UseGamesSessionResult {
  vocabSets: VocabSetSummary[];
  setState: FetchState;
  wordsState: FetchState;
  selectedSetId: string;
  selectedSetName: string;
  words: WordWithRelations[];
  weeklyWords: WordWithRelations[];
  reviewWords: WordWithRelations[];
  weeklyMastery: WeeklyMasterySummary;
  errorMessage: string | null;
  handleSelectSet: (setId: string) => void;
}

type RawVocabSetResponse = VocabSetSummary & { words: WordWithRelations[] };

const toDate = (value: Date | string | number) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export function useGamesSession(): UseGamesSessionResult {
  const [vocabSets, setVocabSets] = useState<VocabSetSummary[]>([]);
  const [setState, setSetState] = useState<FetchState>("idle");
  const [wordsState, setWordsState] = useState<FetchState>("idle");
  const [selectedSetId, setSelectedSetId] = useState("");
  const [selectedSetName, setSelectedSetName] = useState("");
  const [words, setWords] = useState<WordWithRelations[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchSets = async () => {
      setSetState("loading");
      setErrorMessage(null);

      try {
        const response = await fetch("/api/vocab", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load vocabulary sets");
        }

        if (!active) return;

        const sets = data as VocabSetSummary[];
        setVocabSets(sets);

        if (sets.length > 0) {
          const latestSet = sets.reduce((latest, current) => {
            const currentMatch = current.name?.match(/lesson\s+(\d+)/i);
            const latestMatch = latest.name?.match(/lesson\s+(\d+)/i);

            if (!currentMatch) return latest;
            if (!latestMatch) return current;

            const currentNum = parseInt(currentMatch[1], 10);
            const latestNum = parseInt(latestMatch[1], 10);

            return currentNum > latestNum ? current : latest;
          }, sets[0]);

          setSelectedSetId(latestSet.id);
          setSelectedSetName(latestSet.name ?? "");
        }

        setSetState("idle");
      } catch (error) {
        if (!active) return;
        setSetState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load vocabulary sets");
      }
    };

    fetchSets();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSetId) {
      setWords([]);
      setSelectedSetName("");
      return;
    }

    let active = true;

    const fetchWords = async () => {
      setWordsState("loading");
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/vocab/${selectedSetId}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load vocabulary set");
        }

        if (!active) return;

        const vocabSet = data as RawVocabSetResponse;
        setSelectedSetName(vocabSet.name ?? "");
        setWords(vocabSet.words ?? []);
        setWordsState("idle");
      } catch (error) {
        if (!active) return;
        setWordsState("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load vocabulary words");
        setWords([]);
      }
    };

    fetchWords();

    return () => {
      active = false;
    };
  }, [selectedSetId]);

  const sortedWords = useMemo(() => {
    return [...words].sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }, [words]);

  const weeklyWords = useMemo(() => {
    if (sortedWords.length <= WEEKLY_WORD_LIMIT) {
      return sortedWords;
    }

    const recentWords = sortedWords.filter((word) => {
      const progress = word.progress?.find((item) => item.userId == null);
      const mastery = toMasteryLevel(progress?.masteryLevel);
      return mastery <= 2;
    });

    if (recentWords.length >= WEEKLY_WORD_LIMIT) {
      return recentWords.slice(0, WEEKLY_WORD_LIMIT);
    }

    const needed = WEEKLY_WORD_LIMIT - recentWords.length;
    const fillers = sortedWords.filter((word) => !recentWords.includes(word)).slice(0, needed);
    return [...recentWords, ...fillers].slice(0, WEEKLY_WORD_LIMIT);
  }, [sortedWords]);

  const reviewWords = useMemo(() => {
    const mastered = sortedWords.filter((word) => {
      const progress = word.progress?.find((item) => item.userId == null);
      const mastery = toMasteryLevel(progress?.masteryLevel);
      return mastery >= 3;
    });

    return mastered.length > 0 ? mastered : sortedWords.slice(-WEEKLY_WORD_LIMIT);
  }, [sortedWords]);

  const weeklyMastery = useMemo<WeeklyMasterySummary>(() => {
    if (weeklyWords.length === 0) {
      return {
        averageLevel: 0,
        masteredCount: 0,
        needsReviewCount: 0,
        levelDistribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const baseDistribution: Record<MasteryLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const { totalLevel, masteredCount, needsReviewCount, distribution } = weeklyWords.reduce(
      (acc, word) => {
        const progress = word.progress?.find((item) => item.userId == null);
        const mastery = toMasteryLevel(progress?.masteryLevel);
        acc.totalLevel += mastery;
        acc.distribution[mastery] = (acc.distribution[mastery] ?? 0) + 1;

        if (mastery >= 4) {
          acc.masteredCount += 1;
        } else if (mastery <= 2) {
          acc.needsReviewCount += 1;
        }

        return acc;
      },
      {
        totalLevel: 0,
        masteredCount: 0,
        needsReviewCount: 0,
        distribution: { ...baseDistribution },
      }
    );

    return {
      averageLevel: totalLevel / weeklyWords.length,
      masteredCount,
      needsReviewCount,
      levelDistribution: distribution,
    };
  }, [weeklyWords]);

  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    const set = vocabSets.find((item) => item.id === setId);
    setSelectedSetName(set?.name ?? "");
  };

  return {
    vocabSets,
    setState,
    wordsState,
    selectedSetId,
    selectedSetName,
    words,
    weeklyWords,
    reviewWords,
    weeklyMastery,
    errorMessage,
    handleSelectSet,
  };
}
