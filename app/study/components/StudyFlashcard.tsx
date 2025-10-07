'use client';
import { MASTERY_COLORS, MASTERY_LABELS, type MasteryLevel } from "@/lib/types";
import type { FetchState, WordWithRelations } from "@/lib/study/types";
import { Eye, EyeOff, Images } from "lucide-react";
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="text-5xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Vocabulary Set Selected</h3>
        <p className="text-slate-600">Select a vocabulary set from the dropdown above to start studying.</p>
      </div>
    );
  }

  if (wordsState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="mt-4 text-slate-600">Loading vocabulary words...</p>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-slate-600">
          <p className="font-medium">Select a vocabulary set to begin studying.</p>
          {selectedSetName && wordsState === "idle" && (
            <p className="mt-2 text-sm">This set doesn&apos;t have any words yet. Add some on the Create page.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-white/50 bg-gradient-to-br from-white/95 via-white/90 to-indigo-50/40 p-5 shadow-xl backdrop-blur md:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/60 pb-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500/80">
            {selectedSetName || "Vocabulary Adventure"}
          </p>
          <p className="text-sm font-medium text-slate-500">
            Word {currentIndex + 1} of {words.length}
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${MASTERY_COLORS[currentMastery]}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {MASTERY_LABELS[currentMastery]}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              {currentWord.word}
            </h2>
            <button
              onClick={() => speak(currentWord.word)}
              disabled={isSpeaking}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner shadow-indigo-500/20 transition hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              aria-label="Play pronunciation"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>

          {currentWord.pronunciation && (
            <p className="text-lg font-medium text-slate-500">{currentWord.pronunciation}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {currentWord.partOfSpeech && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {currentWord.partOfSpeech}
              </span>
            )}
            {currentExamples.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Visuals Available
              </span>
            )}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 md:mx-0 md:max-w-none md:flex-row">
          <button
            onClick={onToggleDetails}
            type="button"
            className="flex-1 rounded-2xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="flex items-center justify-center gap-2">
              {showDetails ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
              {showDetails ? "Hide Answer" : "Show Answer"}
            </span>
          </button>
          {currentExamples.length > 0 && (
            <button
              onClick={() => onOpenImageModal(0)}
              type="button"
              className="flex-1 rounded-2xl bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <span className="flex items-center justify-center gap-2">
                <Images className="h-5 w-5" aria-hidden="true" />
                Visual Examples
              </span>
            </button>
          )}
        </div>

        {showDetails && (
          <div className="space-y-3">
            <article className="rounded-3xl border border-indigo-100 bg-white/80 p-4 text-left shadow">
              <header className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-500">Definition</h3>
                <button
                  onClick={() => speak(currentWord.definition)}
                  disabled={isSpeaking}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
                  aria-label="Play definition"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              </header>
              <p className="text-lg font-medium leading-relaxed text-slate-900">
                {currentWord.definition}
              </p>
            </article>

            {currentWord.teacherDefinition && (
              <article className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-left shadow">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Teacher's Definition</h3>
                <p className="mt-2 text-base font-medium leading-relaxed text-amber-900">
                  {currentWord.teacherDefinition}
                </p>
              </article>
            )}

            {currentExamples.length > 0 && (
              <section className="rounded-3xl border border-white/60 bg-white/70 p-4 shadow">
                <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-600">Example Sentences</h3>
                  <p className="text-xs text-slate-400">Tap any sentence to open the gallery.</p>
                </header>
                <ul className="grid gap-2.5 md:grid-cols-2" role="list">
                  {currentExamples.map((example, index) => (
                    <li key={example.id}>
                      <button
                        type="button"
                        onClick={() => onOpenImageModal(index)}
                        className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        style={
                          example.imageUrl
                            ? {
                                backgroundImage: `url(${example.imageUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      >
                        {example.imageUrl && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/85 to-white/95 transition duration-300 group-hover:from-white/90 group-hover:via-white/80 group-hover:to-white/90" />
                        )}
                        <div className="relative z-10 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <span>Example {index + 1}</span>
                            {example.imageUrl && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-600">Image Ready</span>}
                          </div>
                          <p className="text-sm leading-relaxed text-slate-800">
                            {example.sentence}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600">
                            {example.imageUrl ? "View or regenerate" : "Create a visual"}
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
