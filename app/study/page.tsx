"use client";

import { StudyControls } from "./components/StudyControls";
import { StudyFlashcard } from "./components/StudyFlashcard";
import { StudyHeader } from "./components/StudyHeader";
import { StudyImageModal } from "./components/StudyImageModal";
import { useStudySession } from "./hooks/useStudySession";

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
    <div className="relative min-h-[100svh] bg-gradient-to-br from-[#eef3ff] via-[#f8f2ff] to-[#ffe8f3] pb-28 pt-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <StudyHeader
          vocabSets={vocabSets}
          selectedSetId={selectedSetId}
          onSelectSet={handleSelectSet}
          masterySegments={masterySegments}
          totalWords={totalWords}
        />

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
          <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl">
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
