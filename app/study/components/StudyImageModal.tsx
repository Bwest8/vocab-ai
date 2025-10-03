import type { WordWithRelations } from "@/lib/study/types";

interface StudyImageModalProps {
  open: boolean;
  word: WordWithRelations | null;
  examples: NonNullable<WordWithRelations["examples"]>;
  selectedExampleIndex: number;
  totalExampleSlots: number;
  onSelectExample: (index: number) => void;
  onClose: () => void;
  onGenerateImage: () => void;
  isGeneratingSelectedExample: boolean;
  generatingExampleIds: Set<string>;
  imageGenerationError: string | null;
  imageGenerationNotice: string | null;
}

export function StudyImageModal({
  open,
  word,
  examples,
  selectedExampleIndex,
  totalExampleSlots,
  onSelectExample,
  onClose,
  onGenerateImage,
  isGeneratingSelectedExample,
  generatingExampleIds,
  imageGenerationError,
  imageGenerationNotice,
}: StudyImageModalProps) {
  if (!open || !word) {
    return null;
  }

  const selectedExample = examples[selectedExampleIndex] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/30 to-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-20 bg-gradient-to-br from-purple-50 to-white border-b border-purple-100 px-6 py-5 rounded-t-3xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{word.word}</h2>
              {word.definition && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{word.definition}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full bg-white hover:bg-purple-50 border-2 border-purple-200 transition-all w-10 h-10 flex items-center justify-center text-gray-600 hover:text-purple-600 text-xl font-light shadow-sm"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="relative rounded-2xl overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-white shadow-inner">
            {selectedExample?.imageUrl ? (
              <img
                src={selectedExample.imageUrl}
                alt={selectedExample.sentence}
                className="w-full h-auto max-h-96 object-contain bg-white"
              />
            ) : (
              <div className="w-full h-80 flex flex-col items-center justify-center gap-3 text-gray-400">
                <svg className="w-20 h-20 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium">No image yet</p>
              </div>
            )}

            {isGeneratingSelectedExample && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                <p className="text-sm font-semibold text-purple-600">Creating image...</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-200">
            <div className="flex gap-3">
              <span className="text-3xl text-indigo-400/60 flex-shrink-0">"</span>
              <p className="text-base leading-relaxed text-gray-800 font-medium pt-1">
                {selectedExample ? selectedExample.sentence : "Select an example below"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Example</p>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: totalExampleSlots }).map((_, index) => {
                const example = examples[index];
                const isSelected = index === selectedExampleIndex;
                const isGenerating = example ? generatingExampleIds.has(example.id) : false;
                const hasImage = Boolean(example?.imageUrl);

                return (
                  <button
                    key={index}
                    onClick={() => example && onSelectExample(index)}
                    disabled={!example}
                    className={`relative h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-500 text-white shadow-lg scale-105"
                        : hasImage
                        ? "border-green-300 bg-green-50 text-green-700 hover:border-green-400"
                        : "border-gray-200 bg-white text-gray-500 hover:border-purple-300"
                    } ${example ? "" : "opacity-40 cursor-not-allowed"} ${
                      isGenerating ? "animate-pulse border-purple-400 bg-purple-100" : ""
                    }`}
                  >
                    <span className={`text-xl font-bold ${isGenerating ? "animate-bounce" : ""}`}>{index + 1}</span>
                    {isGenerating && (
                      <>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 to-indigo-400/20 animate-pulse" />
                        <div className="absolute -top-1 -right-1">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
                          </span>
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {imageGenerationError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <p>{imageGenerationError}</p>
            </div>
          )}

          {imageGenerationNotice && !imageGenerationError && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
              <span className="text-lg">✅</span>
              <p>{imageGenerationNotice}</p>
            </div>
          )}

          <button
            onClick={onGenerateImage}
            disabled={!selectedExample || isGeneratingSelectedExample}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isGeneratingSelectedExample ? (
              <>
                <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span className="text-xl">{selectedExample?.imageUrl ? "🔄" : "✨"}</span>
                <span>{selectedExample?.imageUrl ? "Regenerate Image" : "Generate Image"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
