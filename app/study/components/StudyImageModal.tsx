"use client";

import { useEffect, useState } from "react";
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
  isGeneratingSelectedExample,
  generatingExampleIds,
  imageGenerationError,
  imageGenerationNotice,
}: StudyImageModalProps) {
  const [loadedImageUrls, setLoadedImageUrls] = useState<Set<string>>(() => new Set());
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(() => new Set());
  const [imageRetryKey, setImageRetryKey] = useState(0);
  // Smooth crossfade support
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [transitionUrl, setTransitionUrl] = useState<string | null>(null);

  const selectedExample = examples[selectedExampleIndex] ?? null;

  // Build a cache-busted URL so freshly regenerated images (same filename) actually reload in the PWA.
  // Uses the example.updatedAt timestamp which changes on successful generation.
  const cacheBustedUrl = selectedExample?.imageUrl
    ? `${selectedExample.imageUrl}${selectedExample?.updatedAt ? `?v=${new Date(selectedExample.updatedAt as unknown as string).getTime()}` : ''}`
    : null;

  const activeImageUrl = cacheBustedUrl;

  // Decide which URLs to render for crossfade
  useEffect(() => {
    if (!open) {
      setDisplayUrl(null);
      setTransitionUrl(null);
      return;
    }
    if (!activeImageUrl) {
      setDisplayUrl(null);
      setTransitionUrl(null);
      return;
    }
    // First time: show current as display
    if (!displayUrl) {
      setDisplayUrl(activeImageUrl);
      return;
    }
    // If URL changed, start a transition
    if (activeImageUrl !== displayUrl && activeImageUrl !== transitionUrl) {
      setTransitionUrl(activeImageUrl);
    }
  }, [open, activeImageUrl, displayUrl, transitionUrl]);

  const baseUrl = displayUrl;
  const overlayUrl = transitionUrl;

  const baseError = baseUrl ? failedImageUrls.has(baseUrl) : false;
  const overlayError = overlayUrl ? failedImageUrls.has(overlayUrl) : false;
  const baseLoaded = baseUrl ? loadedImageUrls.has(baseUrl) && !baseError : false;
  const overlayLoaded = overlayUrl ? loadedImageUrls.has(overlayUrl) && !overlayError : false;

  const handleImageLoad = (url: string) => {
    setLoadedImageUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
    setFailedImageUrls((prev) => {
      if (!prev.has(url)) return prev;
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleImageError = (url: string) => {
    setFailedImageUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
    setLoadedImageUrls((prev) => {
      if (!prev.has(url)) return prev;
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const retryImage = (url: string) => {
    setFailedImageUrls((prev) => {
      if (!prev.has(url)) return prev;
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
    setLoadedImageUrls((prev) => {
      if (!prev.has(url)) return prev;
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
    setImageRetryKey((prev) => prev + 1);
  };

  const imageContentKey = selectedExample?.imageUrl
    ? `${selectedExample.id}-${imageRetryKey}`
    : `no-image-${selectedExampleIndex}`;

  // Early return AFTER all hooks have been called
  if (!open || !word) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="relative z-10 flex h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-white shadow-2xl sm:h-[calc(100dvh-1.5rem)] sm:max-h-[980px] sm:w-[98%] sm:rounded-2xl">
        {/* Enhanced Header - Emphasize the Word */}
        <div className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-indigo-800 px-4 py-3 shadow-lg sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 sm:gap-4">
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">{word.word}</h2>
                <div className="flex flex-col pt-1">
                  {word.partOfSpeech && (
                    <span className="inline-block rounded-md bg-white/25 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white tracking-wide">
                      {word.partOfSpeech}
                    </span>
                  )}
                  {word.pronunciation && (
                    <span className="mt-1 text-base font-medium text-indigo-200 sm:text-lg">/{word.pronunciation}/</span>
                  )}
                </div>
              </div>
              {/* Definition */}
              {word.definition && (
                <p className="mt-2 max-w-3xl border-l-4 border-indigo-400/50 pl-3 text-xs italic leading-relaxed text-indigo-100 sm:mt-3 sm:pl-4 sm:text-sm md:text-base">{word.definition}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-lg border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:self-start"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 bg-gradient-to-br from-slate-50 to-white px-3 py-3 sm:space-y-5 sm:px-6 sm:py-5">
          {/* Example Sentence - Prominent */}
          <div className="mx-auto w-full max-w-5xl rounded-xl border border-indigo-200 bg-white p-3 shadow-sm sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:h-12 sm:w-12">
                <svg className="h-5 w-5 text-indigo-600 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">
                  Example {selectedExampleIndex + 1} of {totalExampleSlots}
                </p>
                <p className="text-sm font-medium leading-relaxed text-slate-800 sm:text-base md:text-lg">
                  {selectedExample ? selectedExample.sentence : "Select an example below to view"}
                </p>
              </div>
            </div>
          </div>

          {/* Image Display - 16:9 fixed aspect, full cover */}
          <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-100 rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedExample?.imageUrl ? (
                  <div className="absolute inset-0">
                    {/* Base image (currently displayed) */}
                    {baseUrl && !baseError && (
                      <motion.img
                        key={`base-${baseUrl}`}
                        src={baseUrl}
                        alt={selectedExample.sentence}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: baseLoaded ? 1 : 0.001 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        onLoad={() => handleImageLoad(baseUrl)}
                        onError={() => handleImageError(baseUrl)}
                      />
                    )}

                    {/* Incoming image (crossfade overlay) */}
                    {overlayUrl && !overlayError && (
                      <motion.img
                        key={`overlay-${overlayUrl}`}
                        src={overlayUrl}
                        alt={selectedExample.sentence}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: overlayLoaded ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        onLoad={() => {
                          handleImageLoad(overlayUrl);
                          // Commit the transition
                          setDisplayUrl(overlayUrl);
                          setTransitionUrl(null);
                        }}
                        onError={() => {
                          handleImageError(overlayUrl);
                          setTransitionUrl(null);
                        }}
                      />
                    )}

                    {/* Center spinner only when no image is visible yet */}
                    {!baseLoaded && !overlayLoaded && (baseUrl || overlayUrl) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                    )}

                    {/* Error overlay if both sources failed */}
                    {((baseUrl && baseError) || (overlayUrl && overlayError)) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 bg-white/90">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">Image failed to load</p>
                        {selectedExample.imageUrl && (
                          <button
                            onClick={() => retryImage(selectedExample.imageUrl!)}
                            className="text-xs font-semibold text-indigo-600 hover:underline"
                          >Retry</button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    key={`no-image-${selectedExampleIndex}`}
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
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 sm:text-sm">Select Example Sentence</h3>
              <span className="text-xs text-slate-500 font-medium">
                {examples.filter(e => e?.imageUrl).length} of {examples.length} have images
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
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
                    className={`relative h-14 rounded-lg border flex flex-col items-center justify-center transition-all font-semibold text-xs sm:h-16 sm:text-sm ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-lg"
                        : hasImage
                        ? "border-green-400 bg-green-50 text-green-700 hover:border-green-500 hover:bg-green-100"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                    } ${example ? "" : "opacity-30 cursor-not-allowed"} ${
                      isGenerating ? "border-indigo-400 bg-indigo-100" : ""
                    }`}
                  >
                    <span className="text-xl font-bold sm:text-2xl">{index + 1}</span>
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

          {/* Feedback area */}
          <div className="sticky bottom-0 mx-auto w-full max-w-5xl space-y-3 bg-gradient-to-t from-white via-white to-transparent pb-1 pt-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
