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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="relative z-10 w-[98%] h-[98%] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">{word.word}</h2>
              {word.definition && (
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{word.definition}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm max-w-4xl mx-auto">
            {selectedExample?.imageUrl ? (
              <img
                src={selectedExample.imageUrl}
                alt={selectedExample.sentence}
                className="w-full h-auto max-h-[60vh] object-contain bg-white"
              />
            ) : (
              <div className="w-full h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
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
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <p className="text-sm font-semibold text-indigo-600">Creating image...</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 max-w-4xl mx-auto">
            <div className="flex gap-3">
              <span className="text-3xl text-slate-400 flex-shrink-0">"</span>
              <p className="text-base leading-relaxed text-slate-800 font-medium pt-1">
                {selectedExample ? selectedExample.sentence : "Select an example below"}
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Select Example</p>
            <div className="grid grid-cols-5 gap-2">
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
                    className={`relative h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-all font-semibold text-sm ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                        : hasImage
                        ? "border-green-300 bg-green-50 text-green-700 hover:border-green-400"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    } ${example ? "" : "opacity-40 cursor-not-allowed"} ${
                      isGenerating ? "animate-pulse border-indigo-400 bg-indigo-100" : ""
                    }`}
                  >
                    <span className={isGenerating ? "animate-bounce" : ""}>{index + 1}</span>
                    {isGenerating && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {imageGenerationError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2 max-w-4xl mx-auto">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p>{imageGenerationError}</p>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <button
              onClick={onGenerateImage}
              disabled={!selectedExample || isGeneratingSelectedExample}
              className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isGeneratingSelectedExample ? (
                <>
                  <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedExample?.imageUrl ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"} />
                  </svg>
                  <span>{selectedExample?.imageUrl ? "Regenerate Image" : "Generate Image"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
