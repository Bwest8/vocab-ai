import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const selectedExample = examples[selectedExampleIndex] ?? null;

  // Reset image loading state when the selected example changes
  useEffect(() => {
    if (selectedExample?.imageUrl) {
      setImageLoading(true);
      setImageError(false);
    } else {
      setImageLoading(false);
      setImageError(false);
    }
  }, [selectedExample?.id, selectedExample?.imageUrl]);

  // Early return AFTER all hooks have been called
  if (!open || !word) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="relative z-10 w-[98%] h-[98%] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Enhanced Header - Emphasize the Word */}
        <div className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-4 shadow-lg">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{word.word}</h2>
                <div className="flex flex-col">
                  {word.partOfSpeech && (
                    <span className="inline-block rounded-md bg-white/25 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white tracking-wide">
                      {word.partOfSpeech}
                    </span>
                  )}
                  {word.pronunciation && (
                    <span className="text-lg text-indigo-200 font-medium mt-1">/{word.pronunciation}/</span>
                  )}
                </div>
              </div>
              {/* Definition */}
              {word.definition && (
                <p className="mt-3 border-l-4 border-indigo-400/50 pl-4 text-sm md:text-base text-indigo-100 leading-relaxed max-w-3xl italic">{word.definition}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors w-10 h-10 flex items-center justify-center text-white border border-white/30"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-gradient-to-br from-slate-50 to-white">
          {/* Example Sentence - Prominent */}
          <div className="bg-white rounded-xl p-5 border border-indigo-200 shadow-sm max-w-5xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
                  Example {selectedExampleIndex + 1} of {totalExampleSlots}
                </p>
                <p className="text-base md:text-lg leading-relaxed text-slate-800 font-medium">
                  {selectedExample ? selectedExample.sentence : "Select an example below to view"}
                </p>
              </div>
            </div>
          </div>

          {/* Image Display - 16:9 fixed aspect, full cover */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm max-w-5xl mx-auto">
            <div className="relative w-full aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedExample?.imageUrl ? (
                  <motion.div
                    key={selectedExample.imageUrl}
                    initial={{ opacity: 0.3, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    {/* Loading overlay */}
                    {imageLoading && (
                      <motion.div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <motion.div
                          className="h-14 w-14 rounded-full border-4 border-indigo-200 border-t-indigo-600"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </motion.div>
                    )}
                    {/* Image error state */}
                    {imageError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 bg-white">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">Image failed to load</p>
                        <button
                          onClick={() => { setImageError(false); setImageLoading(true); }}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >Retry</button>
                      </div>
                    )}
                    {!imageError && (
                      <motion.img
                        src={selectedExample.imageUrl}
                        alt={selectedExample.sentence}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: imageLoading ? 0 : 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        onLoad={() => setImageLoading(false)}
                        onError={() => { setImageLoading(false); setImageError(true); }}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400"
                  >
                    <motion.svg
                      className="w-20 h-20 opacity-30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </motion.svg>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-500 mb-1">No image yet</p>
                      <p className="text-xs text-slate-400">Generate one below to visualize this example</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Generation overlay */}
              <AnimatePresence>
                {isGeneratingSelectedExample && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10"
                  >
                    <motion.div
                      className="flex gap-2"
                      variants={{
                        start: { transition: { staggerChildren: 0.15 } },
                        end: { transition: { staggerChildren: 0.15 } },
                      }}
                      initial="start"
                      animate="end"
                    >
                      <motion.div
                        className="h-4 w-4 bg-indigo-500 rounded-full"
                        variants={{ start: { y: "0%" }, end: { y: "100%" } }}
                        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      />
                      <motion.div
                        className="h-4 w-4 bg-purple-500 rounded-full"
                        variants={{ start: { y: "0%" }, end: { y: "100%" } }}
                        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      />
                      <motion.div
                        className="h-4 w-4 bg-teal-500 rounded-full"
                        variants={{ start: { y: "0%" }, end: { y: "100%" } }}
                        transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      />
                    </motion.div>
                    <p className="text-sm font-semibold text-indigo-700">AI is painting your image...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Example Selector - More Prominent */}
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Select Example Sentence</h3>
              <span className="text-xs text-slate-500 font-medium">
                {examples.filter(e => e?.imageUrl).length} of {examples.length} have images
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: totalExampleSlots }).map((_, index) => {
                const example = examples[index];
                const isSelected = index === selectedExampleIndex;
                const isGenerating = example ? generatingExampleIds.has(example.id) : false;
                const hasImage = Boolean(example?.imageUrl);

                return (
                  <motion.button
                    key={index}
                    onClick={() => example && onSelectExample(index)}
                    disabled={!example}
                    whileHover={example && !isGenerating ? { scale: 1.05 } : {}}
                    whileTap={example && !isGenerating ? { scale: 0.95 } : {}}
                    className={`relative h-16 rounded-lg border flex flex-col items-center justify-center transition-all font-semibold text-sm ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-lg"
                        : hasImage
                        ? "border-green-400 bg-green-50 text-green-700 hover:border-green-500 hover:bg-green-100"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    } ${example ? "" : "opacity-30 cursor-not-allowed"} ${
                      isGenerating ? "border-indigo-400 bg-indigo-100" : ""
                    }`}
                  >
                    <span className="text-2xl font-bold">{index + 1}</span>
                    {isGenerating && (
                      <div className="absolute top-1 right-1">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      </div>
                    )}
                    {hasImage && !isGenerating && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1"
                      >
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Generate Button - More Prominent */}
          <div className="max-w-5xl mx-auto space-y-3">
            <AnimatePresence mode="wait">
              {imageGenerationError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-red-50 border-2 border-red-200 px-5 py-4 text-sm text-red-700 flex items-start gap-3"
                >
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="flex-1">{imageGenerationError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={onGenerateImage}
              disabled={!selectedExample || isGeneratingSelectedExample}
              whileHover={!isGeneratingSelectedExample && selectedExample ? { scale: 1.01 } : {}}
              whileTap={!isGeneratingSelectedExample && selectedExample ? { scale: 0.99 } : {}}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold text-sm md:text-base hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-3"
            >
              {isGeneratingSelectedExample ? (
                <>
                  <motion.span 
                    className="h-6 w-6 border-3 border-white/50 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Creating Visual...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedExample?.imageUrl ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"} />
                  </svg>
                  <span>{selectedExample?.imageUrl ? "Regenerate Visual" : "Generate Visual for This Example"}</span>
                </>
              )}
            </motion.button>
                      </div>
        </div>
      </div>
    </div>
  );
}
