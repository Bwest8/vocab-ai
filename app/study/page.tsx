"use client";

import PageHeader from "../components/PageHeader";
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
    <>
      <PageHeader
        title="Study Flashcards"
        subtitle="Master your vocabulary"
        description="Review your vocabulary words with interactive flashcards. Mark your progress as you learn!"
        vocabSets={vocabSets}
        selectedSetId={selectedSetId}
        onSelectSet={handleSelectSet}
      />

      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-6 md:pt-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-base text-rose-600">
            {errorMessage}
          </div>
        )}

        {/* Main Layout - Optimized for iPad Vertical */}
        <main className="flex flex-1 flex-col gap-6">
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
            <StudyWordList
              words={words}
              currentIndex={currentIndex}
              onSelectWord={goToWord}
            />

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
          </aside>
        </div>
      </main>

      {currentWord && (
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur lg:sticky">
          <div className="mx-auto flex w-full max-w-6xl px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-4">
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
      </div>
    </>
  );
}
