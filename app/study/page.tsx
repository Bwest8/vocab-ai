"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudyProgress, VocabSet, VocabWord } from "@/lib/types";
import { MASTERY_COLORS, MASTERY_LABELS, type MasteryLevel } from "@/lib/types";

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
  const currentProgress = currentWord?.progress?.find((item) => item.userId == null) ?? null;
  const currentMastery = toMasteryLevel(currentProgress?.masteryLevel);

  const masterySummary = useMemo(() => {
    const initial: Record<MasteryLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    return words.reduce((acc, word) => {
      const progress = word.progress?.find((item) => item.userId == null);
      const level = toMasteryLevel(progress?.masteryLevel);
      acc[level] += 1;
      return acc;
    }, { ...initial });
  }, [words]);

  const goToNextWord = () => {
    if (words.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % words.length);
    setShowDetails(false);
  };

  const goToPreviousWord = () => {
    if (words.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    setShowDetails(false);
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

  const renderSetList = () => {
    if (setState === "loading" && vocabSets.length === 0) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-16 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      );
    }

    if (setState === "error") {
      return (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-red-700">
          Unable to load vocabulary sets.
        </div>
      );
    }

    if (vocabSets.length === 0) {
      return (
        <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
          <p className="text-gray-600">
            No vocabulary sets yet. Head to the <a href="/create" className="text-blue-600 underline">Create page</a> to add your first set.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {vocabSets.map((set) => {
          const isActive = set.id === selectedSetId;
          return (
            <button
              key={set.id}
              onClick={() => {
                setSelectedSetId(set.id);
                setSelectedSetName(set.name);
              }}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all shadow-sm hover:shadow-md ${
                isActive ? "border-blue-500 bg-white" : "border-transparent bg-white/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{set.name}</h3>
                {set.words && (
                  <span className="text-sm text-gray-500">{set.words.length} words</span>
                )}
              </div>
              {set.grade && <p className="text-sm text-gray-500 mt-1">Grade: {set.grade}</p>}
              {set.description && <p className="text-sm text-gray-500 mt-1">{set.description}</p>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Flashcards</h1>
          <p className="text-gray-600">
            Review your vocabulary sets, track mastery, and keep practicing until every word feels easy.
          </p>
        </header>

        {errorMessage && (
          <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <div className="bg-white/80 rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Vocabulary Sets</h2>
              {renderSetList()}
            </div>

            <div className="bg-white/80 rounded-3xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mastery Overview</h2>
              {words.length === 0 ? (
                <p className="text-sm text-gray-500">Choose a set to see your progress.</p>
              ) : (
                <ul className="space-y-2">
                  {(Object.entries(MASTERY_LABELS) as Array<[string, string]>).map(([levelKey, label]) => {
                    const level = Number(levelKey) as MasteryLevel;
                    const count = masterySummary[level];
                    const color = MASTERY_COLORS[level];
                    return (
                      <li key={levelKey} className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full ${color}`}>
                          {label}
                        </span>
                        <span className="text-sm text-gray-600">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <main className="bg-white/80 rounded-3xl shadow-xl p-8 min-h-[500px] flex flex-col">
            {wordsState === "loading" && words.length === 0 ? (
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
                      <button
                        onClick={() => setShowDetails((prev) => !prev)}
                        className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow"
                      >
                        {showDetails ? "Hide Details" : "Show Answer"}
                      </button>
                    </div>

                    <div className={`mt-8 space-y-6 transition-all duration-200 ${showDetails ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Definition</h3>
                        <p className="text-lg text-gray-800 mt-2 leading-relaxed">{currentWord.definition}</p>
                      </div>

                      {currentWord.examples && currentWord.examples.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Examples</h3>
                          <ul className="mt-3 space-y-3">
                            {currentWord.examples.map((example) => (
                              <li key={example.id} className="bg-white/80 border border-indigo-100 rounded-2xl p-4 text-gray-700 shadow-sm">
                                <p className="text-sm leading-relaxed">{example.sentence}</p>
                                <p className="text-xs text-gray-400 mt-2">🖼️ {example.imageDescription}</p>
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
          </main>
        </div>
      </div>
    </div>
  );
}
