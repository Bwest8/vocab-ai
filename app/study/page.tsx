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
    handleProgress,
    handleOpenImageModal,
    handleCloseImageModal,
    handleGenerateImage,
    handleSelectExample,
  } = useStudySession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <StudyHeader
          vocabSets={vocabSets}
          selectedSetId={selectedSetId}
          onSelectSet={handleSelectSet}
          masterySegments={masterySegments}
          totalWords={totalWords}
        />

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="space-y-6">
          <StudyFlashcard
            words={words}
            wordsState={wordsState}
            selectedSetId={selectedSetId}
            selectedSetName={selectedSetName}
            currentIndex={currentIndex}
            currentWord={currentWord}
            showDetails={showDetails}
            onToggleDetails={toggleDetails}
            onOpenImageModal={handleOpenImageModal}
            currentMastery={currentMastery}
          />

          {currentWord && (
            <StudyControls
              onPrevious={goToPreviousWord}
              onNext={goToNextWord}
              onMarkIncorrect={() => handleProgress(false)}
              onMarkCorrect={() => handleProgress(true)}
              disabled={isUpdatingProgress}
            />
          )}
        </div>
      </div>

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
