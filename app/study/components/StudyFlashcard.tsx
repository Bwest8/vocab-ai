import { MASTERY_COLORS, MASTERY_LABELS, type MasteryLevel } from "@/lib/types";
import type { FetchState, WordWithRelations } from "@/lib/study/types";

interface StudyFlashcardProps {
  words: WordWithRelations[];
  wordsState: FetchState;
  selectedSetId: string;
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
  selectedSetId,
  selectedSetName,
  currentIndex,
  currentWord,
  showDetails,
  onToggleDetails,
  onOpenImageModal,
  currentMastery,
}: StudyFlashcardProps) {
  const currentExamples = currentWord?.examples ?? [];

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
          {selectedSetId && wordsState === "idle" && (
            <p className="mt-2 text-sm">This set doesn&apos;t have any words yet. Add some on the Create page.</p>
          )}
        </div>
      </div>
    );
  }

  return (
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
                onClick={onToggleDetails}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow"
              >
                {showDetails ? "Hide Details" : "Show Answer"}
              </button>
              {currentExamples.length > 0 && (
                <button
                  onClick={() => onOpenImageModal(0)}
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

            {currentExamples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Examples in Context</h3>
                <ul className="space-y-4">
                  {currentExamples.map((example, index) => (
                    <li
                      key={example.id}
                      onClick={() => onOpenImageModal(index)}
                      className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-indigo-50/30 border-2 border-indigo-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                    >
                      {example.imageUrl && (
                        <>
                          <div
                            className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity duration-300"
                            style={{ backgroundImage: `url(${example.imageUrl})`, filter: "blur(3px)" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-100/40" />
                        </>
                      )}

                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                      </div>

                      <div className="relative z-10">
                        <div className="text-3xl text-indigo-400/40 mb-2">"</div>
                        <p className="text-base leading-relaxed font-medium text-gray-800 mb-3 pl-2">{example.sentence}</p>
                        <div className="flex items-start gap-2 mt-4 pt-3 border-t border-indigo-200/50">
                          <span className="text-lg flex-shrink-0">🎨</span>
                          <p className="text-xs text-gray-600 leading-relaxed italic">{example.imageDescription}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>🖼️</span>
                          <span>Click to {example.imageUrl ? "view or regenerate" : "create"} image</span>
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
    </>
  );
}
