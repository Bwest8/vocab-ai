"use client";

import { StudyControls } from "./components/StudyControls";
import { StudyFlashcard } from "./components/StudyFlashcard";
import { StudyImageModal } from "./components/StudyImageModal";
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
    <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-28 pt-3">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 sm:px-6 lg:px-8">
        {/* Slim Header */}
        <header className="flex items-center justify-between gap-4 py-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Study Flashcards</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSetId}
              onChange={(event) => handleSelectSet(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100"
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
          </div>
        </header>

        {errorMessage && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-6 py-4 text-rose-600 shadow-sm">
            {errorMessage}
          </div>
        )}

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
          onPreviousWord={goToPreviousWord}
          onNextWord={goToNextWord}
          onSelectWord={goToWord}
        />
      </div>

      {currentWord && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:px-6">
          <div className="pointer-events-auto mx-auto w-full max-w-3xl space-y-3">
            {/* Progress Overview - Compact at Bottom */}
            {totalWords > 0 && (
              <div className="rounded-2xl border border-slate-200/60 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress</h3>
                  <span className="text-xs font-semibold text-slate-600">
                    {totalWords} {totalWords === 1 ? 'word' : 'words'}
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                  {masterySegments
                    .filter((segment) => segment.percentage > 0)
                    .map((segment, index, array) => {
                      return (
                        <div
                          key={segment.level}
                          className={`relative h-full transition-[width] duration-500 ease-out ${
                            MASTERY_SEGMENT_BG[segment.level]
                          } ${index !== array.length - 1 ? "border-r border-white" : ""}`}
                          style={{ width: `${segment.percentage}%` }}
                          aria-label={`${segment.label}: ${segment.count} words`}
                          title={`${segment.label}: ${segment.count} words (${Math.round(segment.percentage)}%)`}
                        />
                      );
                    })}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {masterySegments.filter(s => s.count > 0).map((segment) => (
                    <div key={segment.level} className="flex items-center gap-1.5 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-sm ${MASTERY_SEGMENT_BG[segment.level]}`} />
                      <span className="text-slate-600">
                        {segment.label}: {segment.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Study Controls */}
            <div className="rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl">
              <StudyControls
                onPrevious={goToPreviousWord}
                onNext={goToNextWord}
                onMarkIncorrect={() => handleProgress(false)}
                onMarkCorrect={() => handleProgress(true)}
                disabled={isUpdatingProgress}
                className="sm:items-center"
              />
            </div>
          </div>
        </div>
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
