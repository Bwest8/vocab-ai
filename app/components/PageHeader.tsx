"use client";

import HamburgerMenu from "./HamburgerMenu";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  showVocabSetSelector?: boolean;
  vocabSets?: Array<{ id: string; name: string; words?: any[] }>;
  selectedSetId?: string;
  onSelectSet?: (setId: string) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  description,
  showVocabSetSelector = true,
  vocabSets = [],
  selectedSetId = "",
  onSelectSet,
  isLoading = false,
  children,
}: PageHeaderProps) {
  return (
    <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <HamburgerMenu />
          <div className="flex-1 min-w-0">
            {subtitle && (
              <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                {subtitle}
              </p>
            )}
            <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {showVocabSetSelector && (
              <div className="hidden sm:flex flex-col gap-1">
                <label htmlFor="vocab-set-selector" className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                  Active vocab set
                </label>
                <select
                  id="vocab-set-selector"
                  value={selectedSetId}
                  onChange={(event) => onSelectSet?.(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100 min-w-[200px]"
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
                {isLoading && <span className="text-xs text-slate-400">Loading words…</span>}
              </div>
            )}
            {!showVocabSetSelector && children && (
              <div className="flex items-center gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
        {showVocabSetSelector && (
          <div className="mt-3 flex items-center gap-3 sm:hidden">
            <div className="flex flex-col gap-1">
              <label htmlFor="vocab-set-selector-mobile" className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                Active vocab set
              </label>
              <select
                id="vocab-set-selector-mobile"
                value={selectedSetId}
                onChange={(event) => onSelectSet?.(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-100"
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
                {isLoading && <span className="text-xs text-slate-400">Loading words…</span>}
              </div>
            </div>
          )}
        {showVocabSetSelector && children && (
          <div className="mt-3 flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
