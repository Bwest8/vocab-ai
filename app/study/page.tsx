"use client";

import HamburgerMenu from "../components/HamburgerMenu";
import { StudyControls } from "./components/StudyControls";
import { StudyFlashcard } from "./components/StudyFlashcard";
import { StudyImageModal } from "./components/StudyImageModal";
import { StudyWordList } from "./components/StudyWordList";
import { useStudySession } from "./hooks/useStudySession";

const MASTERY_SEGMENT_BG: Record<number, string> = {
  0: "bg-gray-300",
  1: "bg-red-300",
  2: "bg-orange-300",
  3: "bg-yellow-300",
  4: "bg-green-300",
  5: "bg-emerald-400",
};

export default function StudyPage() {
  const {
    vocabSets,
    selectedSetId,
    masterySegments,
    totalWords,
    errorMessage,
    words,
    wordsState,
    selectedSetName,
    currentIndex,
    currentWord,
    showDetails,
    currentMastery,
    isUpdatingProgress,
    showImageModal,
    selectedExampleIndex,
    totalExampleSlots,
    currentExamples,
    isGeneratingSelectedExample,
    generatingExampleIds,
    imageGenerationError,
    imageGenerationNotice,
    handleSelectSet,
    toggleDetails,
    goToPreviousWord,
    goToNextWord,
    goToWord,
    handleProgress,
    handleOpenImageModal,
    handleCloseImageModal,
    handleGenerateImage,
    handleSelectExample,
  } = useStudySession();

  return (
    <div className="flex min-h-[100svh] flex-col bg-gradient-to-br from-indigo-50 via-slate-100 to-white">
      {/* Compact Header */}
      <header className="sticky top-0 z-40 flex-shrink-0 border-b border-slate-200/60 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 sm:justify-between">
          <h1 className="w-full text-lg font-bold text-slate-900 sm:w-auto md:text-xl">Study Flashcards</h1>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <select
              value={selectedSetId}
              onChange={(event) => handleSelectSet(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100 sm:min-w-[220px]"
            >
              {vocabSets.length === 0 ? (
                <option value="">No vocabulary sets available</option>
              ) : (
                vocabSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                    {set.words ? ` (${set.words.length})` : ""}
                  </option>
                ))
              )}
            </select>
            <HamburgerMenu className="sm:ml-2" />
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-auto w-full max-w-7xl flex-shrink-0 px-4 pt-4">
          <div className="rounded-xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-rose-600 shadow-sm">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Main Layout - Optimized for iPad Vertical */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-32 pt-6">
        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-stretch">
          <StudyFlashcard
            words={words}
            wordsState={wordsState}
            selectedSetName={selectedSetName}
            currentIndex={currentIndex}
            currentWord={currentWord}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onOpenImageModal={handleOpenImageModal}
            currentMastery={currentMastery}
          />

          <aside className="flex flex-col gap-6">
            {currentWord && totalWords > 0 && (
              <section className="rounded-3xl border border-white/40 bg-white/85 px-5 py-4 shadow-lg backdrop-blur">
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Progress</h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {totalWords} {totalWords === 1 ? "word" : "words"}
                  </span>
                </header>
                <div className="flex h-3 overflow-hidden rounded-full border border-white/60 bg-slate-100">
                  {masterySegments
                    .filter((segment) => segment.percentage > 0)
                    .map((segment, index, array) => (
                      <div
                        key={segment.level}
                        className={`${MASTERY_SEGMENT_BG[segment.level]} ${index !== array.length - 1 ? "border-r border-white/80" : ""} h-full transition-[width] duration-500 ease-out`}
                        style={{ width: `${segment.percentage}%` }}
                        aria-label={`${segment.label}: ${segment.count} words`}
                        title={`${segment.label}: ${segment.count} words (${Math.round(segment.percentage)}%)`}
                      />
                    ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-3">
                  {masterySegments.filter((segment) => segment.count > 0).map((segment) => (
                    <div key={segment.level} className="flex items-center gap-2 rounded-xl bg-white/60 px-2 py-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${MASTERY_SEGMENT_BG[segment.level]}`} />
                      <span className="font-medium text-slate-600">
                        {segment.label}: {segment.count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <StudyWordList
              words={words}
              currentIndex={currentIndex}
              onSelectWord={goToWord}
            />
          </aside>
        </div>
      </main>

      {currentWord && (
        <footer className="sticky bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl px-4 py-5">
            <StudyControls
              onPrevious={goToPreviousWord}
              onNext={goToNextWord}
              onMarkIncorrect={() => handleProgress(false)}
              onMarkCorrect={() => handleProgress(true)}
              disabled={isUpdatingProgress}
            />
          </div>
        </footer>
      )}

      <StudyImageModal
        open={showImageModal}
        word={currentWord}
        examples={currentExamples}
        selectedExampleIndex={selectedExampleIndex}
        totalExampleSlots={totalExampleSlots}
        onSelectExample={handleSelectExample}
        onClose={handleCloseImageModal}
        onGenerateImage={handleGenerateImage}
        isGeneratingSelectedExample={isGeneratingSelectedExample}
        generatingExampleIds={generatingExampleIds}
        imageGenerationError={imageGenerationError}
        imageGenerationNotice={imageGenerationNotice}
      />
    </div>
  );
}
