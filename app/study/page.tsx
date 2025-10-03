"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudyProgress, VocabSet, VocabWord } from "@/lib/types";
import { MASTERY_COLORS, MASTERY_LABELS, type MasteryLevel } from "@/lib/types";

const MASTERY_SEGMENT_BG: Record<MasteryLevel, string> = {
  0: "bg-gray-300",
  1: "bg-red-300",
  2: "bg-orange-300",
  3: "bg-yellow-300",
  4: "bg-green-300",
  5: "bg-emerald-400",
};

type VocabSetSummary = Pick<VocabSet, "id" | "name" | "description" | "grade"> & {
  words?: Array<Pick<VocabWord, "id" | "word">>;
};

type WordWithRelations = VocabWord & {
  examples?: VocabWord["examples"];
  progress?: StudyProgress[];
};

type FetchState = "idle" | "loading" | "error";

function toMasteryLevel(level?: number | null): MasteryLevel {
  const safe = Math.max(0, Math.min(5, Number.isFinite(level ?? NaN) ? Math.round(level as number) : 0));
  return safe as MasteryLevel;
}

function upsertProgressList(list: StudyProgress[] | undefined, updated: StudyProgress) {
  const filtered = (list ?? []).filter((item) => item.userId !== updated.userId);
  return [updated, ...filtered];
}

export default function StudyPage() {
  const [vocabSets, setVocabSets] = useState<VocabSetSummary[]>([]);
  const [setState, setSetState] = useState<FetchState>("idle");
  const [wordsState, setWordsState] = useState<FetchState>("idle");
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [selectedSetName, setSelectedSetName] = useState<string>("");
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

        setVocabSets(data as VocabSetSummary[]);

        if ((data as VocabSetSummary[]).length > 0) {
          const firstSet = (data as VocabSetSummary[])[0];
          setSelectedSetId(firstSet.id);
          setSelectedSetName(firstSet.name);
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

        const vocabSet = data as VocabSet & { words: WordWithRelations[] };
        setSelectedSetName(vocabSet.name);
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

  const currentWord = words[currentIndex] ?? null;
  const currentExamples = currentWord?.examples ?? [];
  const totalExampleSlots = Math.max(currentExamples.length, 5);
  const selectedExample = currentExamples[selectedExampleIndex] ?? null;
  const currentProgress = currentWord?.progress?.find((item) => item.userId == null) ?? null;
  const currentMastery = toMasteryLevel(currentProgress?.masteryLevel);
  const isGeneratingSelectedExample = selectedExample ? generatingExampleIds.has(selectedExample.id) : false;
  const currentQueueLabels = generationQueue.reduce<string[]>((acc, id) => {
    const index = currentExamples.findIndex((example) => example.id === id);
    if (index >= 0) {
      acc.push(`Example ${index + 1}`);
    }
    return acc;
  }, []);

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

  const masterySummary = useMemo(() => {
    const initial: Record<MasteryLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    return words.reduce((acc, word) => {
      const progress = word.progress?.find((item) => item.userId == null);
      const level = toMasteryLevel(progress?.masteryLevel);
      acc[level] += 1;
      return acc;
    }, { ...initial });
  }, [words]);

  const totalWords = words.length;

  const masterySegments = useMemo(
    () =>
      (Object.entries(MASTERY_LABELS) as Array<[string, string]>).map(([levelKey, label]) => {
        const numericLevel = Number(levelKey) as MasteryLevel;
        const count = masterySummary[numericLevel] ?? 0;
        const percentage = totalWords > 0 ? (count / totalWords) * 100 : 0;

        return {
          level: numericLevel,
          label,
          count,
          percentage,
        };
      }),
    [masterySummary, totalWords]
  );

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
      setImageGenerationError('Please select an example to generate an image.');
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
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to generate image for this example.');
      }

      const updatedExample = data.example as NonNullable<WordWithRelations['examples']>[number];

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
        slotIndex >= 0 ? `Image ready for example #${slotIndex + 1}!` : 'Image generated successfully!'
      );
    } catch (error) {
      setImageGenerationError(error instanceof Error ? error.message : 'Unable to generate image for this example.');
    } finally {
      setGeneratingExampleIds((prev) => {
        const next = new Set(prev);
        next.delete(exampleId);
        return next;
      });

      setGenerationQueue((prev) => prev.filter((id) => id !== exampleId));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header with Vocab Set Selector */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Study Flashcards</h1>
              <p className="text-sm text-gray-600 mt-1">Review vocabulary and track your mastery progress</p>
            </div>
            
            {/* Vocab Set Dropdown */}
            <div className="flex-shrink-0 md:w-80">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vocabulary Set
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => {
                  const setId = e.target.value;
                  setSelectedSetId(setId);
                  const selectedSet = vocabSets.find(s => s.id === setId);
                  setSelectedSetName(selectedSet?.name || "");
                }}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-colors"
              >
                {vocabSets.length === 0 ? (
                  <option value="">No vocabulary sets available</option>
                ) : (
                  vocabSets.map(set => (
                    <option key={set.id} value={set.id}>
                      {set.name} {set.words ? `(${set.words.length} words)` : ''} {set.grade ? `- Grade ${set.grade}` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {totalWords > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span className="font-semibold uppercase tracking-widest">Mastery Progress</span>
                <span className="font-medium text-gray-700">{totalWords} words</span>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                {masterySegments
                  .filter((segment) => segment.percentage > 0)
                  .map((segment, idx, arr) => {
                    const showCount = segment.percentage >= 12;
                    return (
                      <div
                        key={segment.level}
                        className={`relative h-full transition-[width] duration-500 ease-out ${MASTERY_SEGMENT_BG[segment.level]} ${
                          idx !== arr.length - 1 ? 'border-r border-white/60' : ''
                        }`}
                        style={{ width: `${segment.percentage}%` }}
                        aria-label={`${segment.label}: ${segment.count} words`}
                      >
                        {showCount ? (
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-900">
                            {segment.count}
                          </span>
                        ) : (
                          <span className="sr-only">{`${segment.label}: ${segment.count} words`}</span>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
                {masterySegments.map((segment) => (
                  <div key={segment.level} className="flex items-center gap-2">
                    <span className={`h-2 w-6 rounded-full ${MASTERY_SEGMENT_BG[segment.level]}`} />
                    <span className="font-medium text-gray-700">{segment.label}</span>
                    <span className="text-gray-500">({segment.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Main Content Area - Flashcard Primary Focus */}
        <div className="space-y-6">
          {/* Flashcard - Primary Focus Area */}
          <div>
            {words.length === 0 ? (
              <div className="bg-white/90 rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vocabulary Set Selected</h3>
                <p className="text-gray-600">Select a vocabulary set from the dropdown above to start studying.</p>
              </div>
            ) : wordsState === "loading" ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                  <p className="mt-4 text-gray-500">Loading vocabulary words...</p>
                </div>
              </div>
            ) : !currentWord ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="font-medium">Select a vocabulary set to begin studying.</p>
                  {selectedSetId && wordsState === "idle" && (
                    <p className="mt-2 text-sm">This set doesn&apos;t have any words yet. Add some on the Create page.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">{selectedSetName}</p>
                    <p className="text-xs text-gray-400">
                      Word {currentIndex + 1} of {words.length}
                    </p>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${MASTERY_COLORS[currentMastery]}`}>
                    {MASTERY_LABELS[currentMastery]}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="bg-gradient-to-br from-indigo-100 via-white to-purple-100 rounded-3xl border border-indigo-100 p-8 shadow-inner">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-4xl font-bold text-gray-900">{currentWord.word}</h2>
                        {currentWord.pronunciation && (
                          <p className="text-lg text-gray-500 mt-1">{currentWord.pronunciation}</p>
                        )}
                        {currentWord.partOfSpeech && (
                          <span className="mt-3 inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            {currentWord.partOfSpeech}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowDetails((prev) => !prev)}
                          className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow"
                        >
                          {showDetails ? "Hide Details" : "Show Answer"}
                        </button>
                        {currentExamples.length > 0 && (
                          <button
                            onClick={() => handleOpenImageModal(0)}
                            className="px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow"
                          >
                            Create Images
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`mt-8 space-y-6 transition-all duration-200 ${showDetails ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Definition</h3>
                        <p className="text-lg text-gray-800 mt-2 leading-relaxed">{currentWord.definition}</p>
                      </div>

                      {currentWord.examples && currentWord.examples.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Examples in Context</h3>
                          <ul className="space-y-4">
                            {currentWord.examples.map((example, index) => (
                              <li 
                                key={example.id} 
                                onClick={() => handleOpenImageModal(index)}
                                className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-indigo-50/30 border-2 border-indigo-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                              >
                                {example.imageUrl && (
                                  <>
                                    <div 
                                      className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity duration-300"
                                      style={{ 
                                        backgroundImage: `url(${example.imageUrl})`,
                                        filter: 'blur(3px)'
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-100/40" />
                                  </>
                                )}
                                
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                                </div>
                                
                                <div className="relative z-10">
                                  <div className="text-3xl text-indigo-400/40 mb-2">"</div>
                                  <p className="text-base leading-relaxed font-medium text-gray-800 mb-3 pl-2">
                                    {example.sentence}
                                  </p>
                                  <div className="flex items-start gap-2 mt-4 pt-3 border-t border-indigo-200/50">
                                    <span className="text-lg flex-shrink-0">🎨</span>
                                    <p className="text-xs text-gray-600 leading-relaxed italic">
                                      {example.imageDescription}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-3 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span>🖼️</span>
                                    <span>Click to {example.imageUrl ? 'view or regenerate' : 'create'} image</span>
                                  </div>
                                </div>
                                
                                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-200/20 to-transparent rounded-tl-full" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {!showDetails && (
                      <div className="mt-10 text-center text-sm text-gray-500">
                        Tap "Show Answer" to reveal the definition and examples.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={goToPreviousWord}
                      className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNextWord}
                      className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProgress(false)}
                      disabled={isUpdatingProgress}
                      className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-red-400 text-red-500 font-semibold hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      I Need Practice
                    </button>
                    <button
                      onClick={() => handleProgress(true)}
                      disabled={isUpdatingProgress}
                      className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      I Knew It
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showImageModal && currentWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/30 to-black/50 backdrop-blur-sm"
            onClick={handleCloseImageModal}
            role="presentation"
          />
          
          {/* Modal Container - Optimized for iPad vertical */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Header - Fixed */}
            <div className="sticky top-0 z-20 bg-gradient-to-br from-purple-50 to-white border-b border-purple-100 px-6 py-5 rounded-t-3xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">{currentWord.word}</h2>
                  {currentWord.definition && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {currentWord.definition}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleCloseImageModal}
                  className="flex-shrink-0 rounded-full bg-white hover:bg-purple-50 border-2 border-purple-200 transition-all w-10 h-10 flex items-center justify-center text-gray-600 hover:text-purple-600 text-xl font-light shadow-sm"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-6 py-6 space-y-6">
              {/* Image Display */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-white shadow-inner">
                {selectedExample?.imageUrl ? (
                  <img
                    src={selectedExample.imageUrl}
                    alt={selectedExample.sentence}
                    className="w-full h-auto max-h-96 object-contain bg-white"
                  />
                ) : (
                  <div className="w-full h-80 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <svg className="w-20 h-20 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">No image yet</p>
                  </div>
                )}

                {isGeneratingSelectedExample && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <p className="text-sm font-semibold text-purple-600">Creating image...</p>
                  </div>
                )}
              </div>

              {/* Example Sentence */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-200">
                <div className="flex gap-3">
                  <span className="text-3xl text-indigo-400/60 flex-shrink-0">"</span>
                  <p className="text-base leading-relaxed text-gray-800 font-medium pt-1">
                    {selectedExample ? selectedExample.sentence : 'Select an example below'}
                  </p>
                </div>
              </div>

              {/* Example Selection Grid */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Select Example
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: totalExampleSlots }).map((_, idx) => {
                    const example = currentExamples[idx];
                    const isSelected = idx === selectedExampleIndex;
                    const isGenerating = example ? generatingExampleIds.has(example.id) : false;
                    const hasImage = Boolean(example?.imageUrl);

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!example) return;
                          setSelectedExampleIndex(idx);
                          setImageGenerationError(null);
                          setImageGenerationNotice(null);
                        }}
                        disabled={!example}
                        className={`relative h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500 text-white shadow-lg scale-105'
                            : hasImage
                            ? 'border-green-300 bg-green-50 text-green-700 hover:border-green-400'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-purple-300'
                        } ${example ? '' : 'opacity-40 cursor-not-allowed'} ${
                          isGenerating ? 'animate-pulse border-purple-400 bg-purple-100' : ''
                        }`}
                      >
                        <span className={`text-xl font-bold ${isGenerating ? 'animate-bounce' : ''}`}>{idx + 1}</span>
                        {isGenerating && (
                          <>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 to-indigo-400/20 animate-pulse" />
                            <div className="absolute -top-1 -right-1">
                              <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                              </span>
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Message Only */}
              {imageGenerationError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <p>{imageGenerationError}</p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleGenerateImage}
                disabled={!selectedExample || isGeneratingSelectedExample}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isGeneratingSelectedExample ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">
                      {selectedExample?.imageUrl ? '🔄' : '✨'}
                    </span>
                    <span>
                      {selectedExample?.imageUrl ? 'Regenerate Image' : 'Generate Image'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
