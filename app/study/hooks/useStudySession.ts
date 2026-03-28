import { useEffect, useMemo, useState } from "react";
import type { MasteryLevel, StudyProgress } from "@/lib/types";
import { buildMasterySegments, buildSimpleSegments, toMasteryLevel, upsertProgressList } from "@/lib/study/utils";
import type {
  FetchState,
  MasterySegment,
  VocabSetSummary,
  WordWithRelations,
} from "@/lib/study/types";

interface UseStudySessionResult {
  vocabSets: VocabSetSummary[];
  setState: FetchState;
  wordsState: FetchState;
  selectedSetId: string;
  selectedSetName: string;
  words: WordWithRelations[];
  currentIndex: number;
  showDetails: boolean;
  errorMessage: string | null;
  isUpdatingProgress: boolean;
  showImageModal: boolean;
  selectedExampleIndex: number;
  generatingExampleIds: Set<string>;
  generationQueue: string[];
  imageGenerationError: string | null;
  imageGenerationNotice: string | null;
  masterySegments: MasterySegment[];
  simpleSegments: import("@/lib/study/types").SimpleSegment[];
  totalWords: number;
  recentWinStreak: number;
  recentWinWordIds: string[];
  currentWord: WordWithRelations | null;
  currentExamples: NonNullable<WordWithRelations["examples"]>;
  selectedExample: NonNullable<WordWithRelations["examples"]>[number] | null;
  totalExampleSlots: number;
  currentMastery: MasteryLevel;
  isGeneratingSelectedExample: boolean;
  handleSelectSet: (setId: string) => void;
  toggleDetails: () => void;
  goToNextWord: () => void;
  goToPreviousWord: () => void;
  goToWord: (index: number) => void;
  handleProgress: (isCorrect: boolean) => Promise<void>;
  handleOpenImageModal: (exampleIndex?: number) => void;
  handleCloseImageModal: () => void;
  handleGenerateImage: () => Promise<void>;
  handleSelectExample: (index: number) => void;
}

export function useStudySession(): UseStudySessionResult {
  const [vocabSets, setVocabSets] = useState<VocabSetSummary[]>([]);
  const [setState, setSetState] = useState<FetchState>("idle");
  const [wordsState, setWordsState] = useState<FetchState>("idle");
  const [selectedSetId, setSelectedSetId] = useState("");
  const [selectedSetName, setSelectedSetName] = useState("");
  const [words, setWords] = useState<WordWithRelations[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const [generatingExampleIds, setGeneratingExampleIds] = useState<Set<string>>(() => new Set());
  const [generationQueue, setGenerationQueue] = useState<string[]>([]);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [imageGenerationNotice, setImageGenerationNotice] = useState<string | null>(null);
  const [recentWinStreak, setRecentWinStreak] = useState(0);
  const [recentWinWordIdsSet, setRecentWinWordIdsSet] = useState<Set<string>>(() => new Set());

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
          // Find the vocab set with the highest lesson number
          const latestSet = sets.reduce((latest, current) => {
            // Extract lesson number from name (e.g., "Lesson 1" -> 1)
            const currentMatch = current.name.match(/lesson\s+(\d+)/i);
            const latestMatch = latest.name.match(/lesson\s+(\d+)/i);
            
            if (!currentMatch) return latest;
            if (!latestMatch) return current;
            
            const currentNum = parseInt(currentMatch[1], 10);
            const latestNum = parseInt(latestMatch[1], 10);
            
            return currentNum > latestNum ? current : latest;
          }, sets[0]);
          
          setSelectedSetId(latestSet.id);
          setSelectedSetName(latestSet.name);
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

        const vocabSet = data as VocabSetSummary & { words: WordWithRelations[] };
        setSelectedSetName(vocabSet.name ?? "");
        setWords(vocabSet.words ?? []);
        setCurrentIndex(0);
        setShowDetails(false);
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

  const currentWord = useMemo(() => words[currentIndex] ?? null, [words, currentIndex]);
  const currentExamples = useMemo(
    () => (currentWord?.examples ?? []) as NonNullable<WordWithRelations["examples"]>,
    [currentWord]
  );
  const totalExampleSlots = Math.max(currentExamples.length, 5);
  const selectedExample = currentExamples[selectedExampleIndex] ?? null;
  const currentProgress = currentWord?.progress?.find((item) => item.userId == null) ?? null;
  const currentMastery = toMasteryLevel(currentProgress?.masteryLevel);
  const isGeneratingSelectedExample = selectedExample ? generatingExampleIds.has(selectedExample.id) : false;

  // Only reset modal/generation state when the CURRENT WORD changes (by id),
  // not when its nested fields update (e.g., imageUrl after generation).
  useEffect(() => {
    if (!currentWord) {
      setShowImageModal(false);
      setSelectedExampleIndex(0);
      setImageGenerationError(null);
      setImageGenerationNotice(null);
      setGeneratingExampleIds(new Set());
      setGenerationQueue([]);
      return;
    }

    // Reset selection and transient state on word change
    setSelectedExampleIndex(0);
    setImageGenerationError(null);
    setImageGenerationNotice(null);
    setGeneratingExampleIds(new Set());
    setGenerationQueue([]);
  }, [currentWord?.id]);

  useEffect(() => {
    if (!showImageModal) return;
    setImageGenerationError(null);
    setImageGenerationNotice(null);
  }, [selectedExampleIndex, showImageModal]);

  const masterySegments = useMemo(() => buildMasterySegments(words), [words]);
  const simpleSegments = useMemo(() => buildSimpleSegments(words), [words]);
  const totalWords = words.length;

  // Fetch recent game attempts to surface a "recent wins" streak chip in Study view
  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    const fetchRecent = async () => {
      if (!selectedSetId) {
        if (!active) return;
        setRecentWinStreak(0);
        setRecentWinWordIdsSet(new Set());
        return;
      }
      try {
        const params = new URLSearchParams({ setId: selectedSetId, minutes: String(30), includeIncorrect: 'true' });
        const res = await fetch(`/api/games/attempts?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load attempts');
        const data = (await res.json()) as { attempts: Array<{ wordId: string | null; correct: boolean; createdAt: string }> };
        if (!active) return;

        const attempts = data.attempts || [];
        // Compute streak from newest going backwards until first incorrect
        let streak = 0;
        for (const a of attempts) {
          if (a.correct) streak += 1; else break;
        }
        const winsByWord = new Set<string>();
        for (const a of attempts) {
          if (a.correct && a.wordId) winsByWord.add(a.wordId);
        }
        setRecentWinStreak(streak);
        setRecentWinWordIdsSet(winsByWord);
      } catch (err) {
        // Non-fatal; just clear
        if (!active) return;
        setRecentWinStreak(0);
        setRecentWinWordIdsSet(new Set());
      }
    };

    void fetchRecent();
    // Refresh periodically to reflect ongoing games (every 25s)
    timer = window.setInterval(() => { void fetchRecent(); }, 25_000);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [selectedSetId]);

  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    const set = vocabSets.find((item) => item.id === setId);
    setSelectedSetName(set?.name ?? "");
  };

  const toggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  const goToWord = (index: number) => {
    if (words.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, words.length - 1));
    setCurrentIndex(safeIndex);
    setShowDetails(false);
    setShowImageModal(false);
  };

  const goToNextWord = () => {
    if (words.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % words.length);
    setShowDetails(false);
    setShowImageModal(false);
  };

  const goToPreviousWord = () => {
    if (words.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    setShowDetails(false);
    setShowImageModal(false);
  };

  const handleProgress = async (isCorrect: boolean) => {
    if (!currentWord) return;

    setIsUpdatingProgress(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wordId: currentWord.id,
          isCorrect,
          userId: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update progress");
      }

      setWords((prev) =>
        prev.map((word) =>
          word.id === currentWord.id
            ? { ...word, progress: upsertProgressList(word.progress, data.progress as StudyProgress) }
            : word
        )
      );

      if (isCorrect) {
        goToNextWord();
      } else {
        setShowDetails(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update progress");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleOpenImageModal = (exampleIndex: number = 0) => {
    if (!currentWord || currentExamples.length === 0) return;
    setSelectedExampleIndex(exampleIndex);
    setImageGenerationError(null);
    setImageGenerationNotice(null);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setImageGenerationError(null);
    setImageGenerationNotice(null);
  };

  const handleGenerateImage = async () => {
    if (!currentWord || !selectedExample) {
      setImageGenerationError("Please select an example to generate an image.");
      return;
    }
    await generateImageForExample(currentWord, selectedExample);
  };

  const handleSelectExample = (index: number) => {
    const example = currentExamples[index];
    if (!example) return;
    setSelectedExampleIndex(index);
    setImageGenerationError(null);
    setImageGenerationNotice(null);

    if (example.imageUrl) {
      return;
    }

    if (generatingExampleIds.has(example.id)) {
      return;
    }

    if (!currentWord) {
      return;
    }

    void generateImageForExample(currentWord, example);
  };

  const generateImageForExample = async (
    word: WordWithRelations,
    example: NonNullable<WordWithRelations["examples"]>[number]
  ) => {
    const exampleId = example.id;

    setGeneratingExampleIds((prev) => {
      const next = new Set(prev);
      next.add(exampleId);
      return next;
    });

    setGenerationQueue((prev) => (prev.includes(exampleId) ? prev : [...prev, exampleId]));

    setImageGenerationError(null);
    setImageGenerationNotice(null);

    try {
      const response = await fetch(
        `/api/vocab/${word.vocabSetId}/examples/${example.id}/generate-image`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to generate image for this example.");
      }

      const updatedExample = data.example as NonNullable<WordWithRelations["examples"]>[number];

      setWords((prevWords) =>
        prevWords.map((wordItem) =>
          wordItem.id === word.id
            ? {
                ...wordItem,
                examples: (wordItem.examples ?? []).map((exampleItem) =>
                  exampleItem.id === updatedExample.id
                    ? { ...exampleItem, imageUrl: updatedExample.imageUrl, updatedAt: updatedExample.updatedAt }
                    : exampleItem
                ),
              }
            : wordItem
        )
      );
    } catch (error) {
      setImageGenerationError(
        error instanceof Error ? error.message : "Unable to generate image for this example."
      );
    } finally {
      setGeneratingExampleIds((prev) => {
        const next = new Set(prev);
        next.delete(exampleId);
        return next;
      });

      setGenerationQueue((prev) => prev.filter((id) => id !== exampleId));
    }
  };

  return {
    vocabSets,
    setState,
    wordsState,
    selectedSetId,
    selectedSetName,
    words,
    currentIndex,
    showDetails,
    errorMessage,
    isUpdatingProgress,
    showImageModal,
    selectedExampleIndex,
    generatingExampleIds,
    generationQueue,
    imageGenerationError,
    imageGenerationNotice,
  masterySegments,
  simpleSegments,
  totalWords,
  recentWinStreak,
  recentWinWordIds: Array.from(recentWinWordIdsSet),
    currentWord,
    currentExamples,
    selectedExample,
    totalExampleSlots,
    currentMastery,
    isGeneratingSelectedExample,
    handleSelectSet,
    toggleDetails,
    goToNextWord,
    goToPreviousWord,
    goToWord,
    handleProgress,
    handleOpenImageModal,
    handleCloseImageModal,
    handleGenerateImage,
    handleSelectExample,
  };
}
