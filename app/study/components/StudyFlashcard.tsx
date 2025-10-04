'use client';
import { MASTERY_COLORS, MASTERY_LABELS, type MasteryLevel } from "@/lib/types";
import { toMasteryLevel } from "@/lib/study/utils";
import type { FetchState, WordWithRelations } from "@/lib/study/types";
import { useState } from 'react';


interface StudyFlashcardProps {
  words: WordWithRelations[];
  wordsState: FetchState;
  selectedSetName: string;
  currentIndex: number;
  currentWord: WordWithRelations | null;
  showDetails: boolean;
  onToggleDetails: () => void;
  onOpenImageModal: (exampleIndex: number) => void;
  currentMastery: MasteryLevel;
  onPreviousWord: () => void;
  onNextWord: () => void;
  onSelectWord: (index: number) => void;
}

export function StudyFlashcard({
  words,
  wordsState,
  selectedSetName,
  currentIndex,
  currentWord,
  showDetails,
  onToggleDetails,
  onOpenImageModal,
  currentMastery,
  onPreviousWord,
  onNextWord,
  onSelectWord,
}: StudyFlashcardProps) {
  const currentExamples = currentWord?.examples ?? [];
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async (text: string) => {
    if (isSpeaking) return;

    setIsSpeaking(true);
    try {
      // Use our cached TTS API endpoint
      const voiceId = '67oeJmj7jIMsdE6yXPr5'; // Current voice ID
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&voiceId=${voiceId}`);

      if (!response.ok) {
        throw new Error('Failed to get audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);
      await audioElement.play();

      // Clean up the URL after playing
      audioElement.onended = () => URL.revokeObjectURL(audioUrl);

    } catch (error) {
      console.error('TTS Error:', error);
      // Fallback to Web Speech API if our API fails
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  if (words.length === 0) {
    return (
      <div className="bg-white/90 rounded-2xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Vocabulary Set Selected</h3>
        <p className="text-gray-600">Select a vocabulary set from the dropdown above to start studying.</p>
      </div>
    );
  }

  if (wordsState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="mt-4 text-gray-500">Loading vocabulary words...</p>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="font-medium">Select a vocabulary set to begin studying.</p>
          {selectedSetName && wordsState === "idle" && (
            <p className="mt-2 text-sm">This set doesn&apos;t have any words yet. Add some on the Create page.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="relative flex flex-col gap-8 rounded-[32px] border border-white/60 bg-white/70 p-5 shadow-2xl shadow-indigo-100/40 backdrop-blur-xl md:p-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPreviousWord}
          className="order-2 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-100 bg-white text-2xl text-indigo-500 shadow hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:order-1"
          aria-label="Go to previous word"
        >
          ‹
        </button>

        <div className="order-1 text-center sm:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            {selectedSetName || "Vocabulary Set"}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Word {currentIndex + 1} of {words.length}
          </p>
        </div>

        <div className="order-3 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-inner shadow-white/60">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${MASTERY_COLORS[currentMastery]}`}>
            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
            {MASTERY_LABELS[currentMastery]}
          </span>
        </div>

        <button
          type="button"
          onClick={onNextWord}
          className="order-4 flex h-12 w-12 items-center justify-center rounded-full border border-indigo-100 bg-white text-2xl text-indigo-500 shadow hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label="Go to next word"
        >
          ›
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-indigo-50 bg-gradient-to-br from-white via-indigo-50/70 to-purple-100/70 p-8 shadow-inner">
        <div className="absolute -left-20 top-16 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-pink-200/20 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{currentWord.word}</h2>
              <button
                onClick={() => speak(currentWord.word)}
                disabled={isSpeaking}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Speak word"
              >
                {isSpeaking ? '⏳' : '🔊'}
              </button>
            </div>
            {currentWord.pronunciation && (
              <p className="mt-2 text-lg font-medium text-slate-500">{currentWord.pronunciation}</p>
            )}
            {currentWord.partOfSpeech && (
              <span className="mt-4 inline-flex items-center rounded-full bg-blue-100/80 px-4 py-1 text-sm font-semibold text-blue-700 shadow-sm">
                {currentWord.partOfSpeech}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <button
              onClick={onToggleDetails}
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/40 transition hover:bg-indigo-700"
            >
              {showDetails ? "Hide Details" : "Show Answer"}
            </button>
            {currentExamples.length > 0 && (
              <button
                onClick={() => onOpenImageModal(0)}
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/40 transition hover:bg-purple-700"
              >
                Create Images
              </button>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="relative mt-10 space-y-6">
            <div className="rounded-3xl bg-white/80 p-6 shadow-sm shadow-indigo-100/60 backdrop-blur">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Definition</h3>
                <button
                  onClick={() => speak(currentWord.definition)}
                  disabled={isSpeaking}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Speak definition"
                >
                  {isSpeaking ? '⏳' : '🔊'}
                </button>
              </div>
              <p className="mt-4 text-lg leading-relaxed text-slate-800 md:text-xl">{currentWord.definition}</p>
            </div>

            {currentExamples.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Examples in Context</h3>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-200">
                    Tap any card to explore imagery and context
                  </p>
                </div>

                <ul className="flex flex-col gap-3" role="list">
                  {currentExamples.map((example, index) => (
                    <li key={example.id}>
                      <button
                        type="button"
                        onClick={() => onOpenImageModal(index)}
                        className="group relative flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-indigo-100/70 bg-white/25 p-5 text-left shadow-lg shadow-indigo-200/40 backdrop-blur-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                      >
                        {example.imageUrl ? (
                          <>
                            <div
                              className="pointer-events-none absolute inset-0 -z-20 opacity-45 transition-opacity duration-300 group-hover:opacity-60"
                              style={{
                                backgroundImage: `url(${example.imageUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white/55 via-white/20 to-indigo-100/20 group-hover:from-white/40 group-hover:via-white/15 group-hover:to-indigo-100/15" />
                          </>
                        ) : (
                          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-white via-indigo-50/60 to-purple-50/70" />
                        )}

                        <header className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                          <span>Example {index + 1}</span>
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] text-indigo-500 shadow-sm">
                            {example.imageUrl ? "Image Ready" : "Illustrate"}
                          </span>
                        </header>

                        <p className="mt-4 text-base font-medium leading-relaxed text-slate-800">{example.sentence}</p>

                        <footer className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-300 opacity-0 transition group-hover:opacity-100">
                          <span>
                            Tap to {example.imageUrl ? "view or regenerate" : "create"} image
                          </span>
                          <span className="text-indigo-400">›</span>
                        </footer>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {!showDetails && (
          <div className="mt-12 text-center text-sm font-medium text-slate-500">
            Tap “Show Answer” to reveal the definition and examples.
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-indigo-50 bg-white/80 p-6 shadow-inner shadow-indigo-100/40">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400">Word Explorer</h3>
          <p className="text-xs text-slate-400">Tap any tile to jump to that word.</p>
        </div>
        <div className="mt-4 max-h-72 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {words.map((word, index) => {
              const progress = word.progress?.find((item) => item.userId == null);
              const mastery = toMasteryLevel(progress?.masteryLevel);
              const isActive = index === currentIndex;

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => onSelectWord(index)}
                  className={`group relative flex h-full flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isActive
                      ? "border-indigo-500 bg-white shadow-xl shadow-indigo-300/40"
                      : "border-transparent bg-white/70 hover:border-indigo-200 hover:shadow-lg"
                  }`}
                  aria-current={isActive}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    #{index + 1}
                  </span>
                  <div className="mt-2 flex items-start gap-2">
                    <span className="text-lg font-bold text-slate-900 leading-snug">{word.word}</span>
                  </div>
                  {word.partOfSpeech && (
                    <span className="mt-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-600">
                      {word.partOfSpeech}
                    </span>
                  )}
                  <span className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${MASTERY_COLORS[mastery]}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {MASTERY_LABELS[mastery]}
                  </span>
                  {isActive && (
                    <span className="absolute -inset-0.5 rounded-2xl border border-indigo-400/40" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
