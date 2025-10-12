"use client";

import HamburgerMenu from "./HamburgerMenu";
import { cn } from "@/lib/utils";

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
              <select
                id="vocab-set-selector"
                value={selectedSetId}
                onChange={(event) => onSelectSet?.(event.target.value)}
                className={cn(
                  "flex h-9 w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 min-w-[200px]",
                  "text-foreground placeholder:text-muted-foreground"
                )}
              >
                {vocabSets.length === 0 ? (
                  <option value="" disabled className="text-muted-foreground">
                    No vocabulary sets available
                  </option>
                ) : (
                  vocabSets.map((set) => (
                    <option key={set.id} value={set.id} className="text-foreground">
                      {set.name}
                      {set.words ? ` (${set.words.length})` : ""}
                    </option>
                  ))
                )}
              </select>
            )}
            {showVocabSetSelector && isLoading && <span className="text-xs text-slate-400">Loading words…</span>}
            {!showVocabSetSelector && children && (
              <div className="flex items-center gap-3">
                {children}
              </div>
            )}
          </div>
        </div>
        {showVocabSetSelector && (
          <div className="mt-3 flex items-center gap-3 sm:hidden">
            <select
              id="vocab-set-selector-mobile"
              value={selectedSetId}
              onChange={(event) => onSelectSet?.(event.target.value)}
              className={cn(
                "flex h-8 w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50",
                "text-foreground placeholder:text-muted-foreground"
              )}
            >
              {vocabSets.length === 0 ? (
                <option value="" disabled className="text-muted-foreground">
                  No vocabulary sets available
                </option>
              ) : (
                vocabSets.map((set) => (
                  <option key={set.id} value={set.id} className="text-foreground">
                    {set.name}
                      {set.words ? ` (${set.words.length})` : ""}
                    </option>
                  ))
                )}
              </select>
              {isLoading && <span className="text-xs text-slate-400">Loading words…</span>}
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
