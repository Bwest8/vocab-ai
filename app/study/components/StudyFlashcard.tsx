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
    <section className="relative flex flex-col gap-6 rounded-xl bg-white/95 p-6 shadow-lg border border-slate-200/50 backdrop-blur-sm md:p-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPreviousWord}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-xl text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
          aria-label="Go to previous word"
        >
          ‹
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {selectedSetName || "Vocabulary Set"}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Word {currentIndex + 1} of {words.length}
          </p>
        </div>

        <button
          type="button"
          onClick={onNextWord}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-xl text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
          aria-label="Go to next word"
        >
          ›
        </button>
      </div>

      {/* Main Flashcard */}
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
        {/* Word Section */}
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{currentWord.word}</h2>
                <button
                  onClick={() => speak(currentWord.word)}
                  disabled={isSpeaking}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Speak word"
                  title="Listen to pronunciation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
              </div>
              
              {currentWord.pronunciation && (
                <p className="text-lg font-medium text-slate-500 mb-3">{currentWord.pronunciation}</p>
              )}
              
              <div className="flex items-center gap-3">
                {currentWord.partOfSpeech && (
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 border border-indigo-100">
                    {currentWord.partOfSpeech}
                  </span>
                )}
                <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold ${MASTERY_COLORS[currentMastery]}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {MASTERY_LABELS[currentMastery]}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:min-w-[200px]">
              <button
                onClick={onToggleDetails}
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
              >
                {showDetails ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Hide Answer
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Show Answer
                  </>
                )}
              </button>
              
              {currentExamples.length > 0 && (
                <button
                  onClick={() => onOpenImageModal(0)}
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Visual Examples
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Answer Section */}
        {showDetails && (
          <div className="border-t-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white">
            <div className="p-8 md:p-10 space-y-6">
              <div className="bg-white rounded-xl border-2 border-indigo-300 p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold uppercase tracking-wide text-indigo-700">Definition</h3>
                  <button
                    onClick={() => speak(currentWord.definition)}
                    disabled={isSpeaking}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Speak definition"
                    title="Listen to definition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xl leading-relaxed text-slate-900 font-medium">{currentWord.definition}</p>
              </div>

              {/* Teacher Definition Admonition */}
              {currentWord.teacherDefinition && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-300 p-6 shadow-md">
                  <div className="flex items-start gap-3 mb-3">

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold uppercase tracking-wide text-amber-800">Teacher's Definition</h3>
                        <button
                          onClick={() => speak(currentWord.teacherDefinition || '')}
                          disabled={isSpeaking}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Speak teacher definition"
                          title="Listen to teacher's explanation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-lg leading-relaxed text-amber-950 font-medium">{currentWord.teacherDefinition}</p>
                    </div>
                  </div>
                </div>
              )}

              {currentExamples.length > 0 && (
                <div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Example Sentences</h3>
                    <p className="text-xs font-medium text-slate-500">
                      Click to view or create visual examples
                    </p>
                  </div>

                  <ul className="flex flex-col gap-3" role="list">
                    {currentExamples.map((example, index) => (
                      <li key={example.id}>
                        <button
                          type="button"
                          onClick={() => onOpenImageModal(index)}
                          className="group relative flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-slate-200 p-5 text-left shadow-sm hover:shadow-md hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all"
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
                          {example.imageUrl ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/95 group-hover:from-white/92 group-hover:via-white/87 group-hover:to-white/92 transition-all duration-300" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
                          )}

                          <header className="relative z-10 flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
                            <span>Example {index + 1}</span>
                            {example.imageUrl && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700 border border-green-100">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Image
                              </span>
                            )}
                          </header>

                          <p className="relative z-10 text-base leading-relaxed text-slate-800">{example.sentence}</p>

                          <footer className="relative z-10 mt-4 flex items-center gap-2 text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
                            <span>
                              {example.imageUrl ? "View or regenerate image" : "Create visual example"}
                            </span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </footer>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Word List */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Word List</h3>
          <p className="text-xs text-slate-500">Click any word to jump to it</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {words.map((word, index) => {
              const progress = word.progress?.find((item) => item.userId == null);
              const mastery = toMasteryLevel(progress?.masteryLevel);
              const isActive = index === currentIndex;

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => onSelectWord(index)}
                  className={`group relative flex items-center rounded-lg border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                  aria-current={isActive}
                >
                  {/* Colored indicator for mastery level */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${MASTERY_COLORS[mastery]}`} />

                  {/* Word number - small and subtle */}
                  <span className="absolute top-1 right-1 text-[10px] font-medium text-slate-400">
                    {index + 1}
                  </span>

                  {/* Main word */}
                  <span className={`text-sm font-semibold leading-tight ml-2 pr-4 ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {word.word}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
