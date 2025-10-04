import { useEffect, useMemo, useState } from "react";
import type { MasteryLevel, StudyProgress } from "@/lib/types";
import { buildMasterySegments, toMasteryLevel, upsertProgressList } from "@/lib/study/utils";
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
  totalWords: number;
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
  const totalWords = words.length;

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

    const exampleId = selectedExample.id;
    const slotIndex = currentExamples.findIndex((example) => example.id === exampleId);

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
        `/api/vocab/${currentWord.vocabSetId}/examples/${selectedExample.id}/generate-image`,
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
        prevWords.map((word) =>
          word.id === currentWord.id
            ? {
                ...word,
                examples: (word.examples ?? []).map((example) =>
                  example.id === updatedExample.id ? { ...example, imageUrl: updatedExample.imageUrl } : example
                ),
              }
            : word
        )
      );

      setImageGenerationNotice(
        slotIndex >= 0 ? `Image ready for example #${slotIndex + 1}!` : "Image generated successfully!"
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

  const handleSelectExample = (index: number) => {
    const example = currentExamples[index];
    if (!example) return;
    setSelectedExampleIndex(index);
    setImageGenerationError(null);
    setImageGenerationNotice(null);
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
    totalWords,
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
