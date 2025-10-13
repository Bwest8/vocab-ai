"use client";

import * as React from "react";
import HamburgerMenu from "./HamburgerMenu";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader as SHeader, SheetTitle as STitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  showVocabSetSelector?: boolean;
  vocabSets?: Array<{ id: string; name: string; words?: any[] }>;
  selectedSetId?: string;
  onSelectSet?: (setId: string) => void;
  rightSlot?: React.ReactNode;
  isLoading?: boolean;
}

export default function Header({
  title,
  subtitle,
  description,
  showVocabSetSelector = true,
  vocabSets = [],
  selectedSetId = "",
  onSelectSet,
  rightSlot,
  isLoading = false,
}: HeaderProps) {
  const selected = vocabSets.find((s) => s.id === selectedSetId) || null;
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg" style={{ paddingTop: "calc(env(safe-area-inset-top,0px) + 2px)" }}>
      <div className="relative mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 py-1.5 md:py-4">
        {/* Mobile top bar */}
        <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center md:hidden">
          <div className="justify-self-start">
            <HamburgerMenu />
          </div>
          <h1
            className="justify-self-center min-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-2 text-center text-[17px] font-semibold tracking-[-0.01em] text-white/95"
            title={title}
          >
            {title}
          </h1>
          {showVocabSetSelector ? (
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Choose set"
                  className="justify-self-end inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-indigo-700 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-200/60 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  <Layers className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-white text-slate-900">
                <SHeader className="p-4">
                  <STitle className="text-lg font-bold">Choose Set</STitle>
                </SHeader>
                <ScrollArea className="h-[50vh] px-4 pb-4">
                  <div className="grid gap-2">
                    {vocabSets.length === 0 ? (
                      <div className="text-sm text-slate-500">No vocabulary sets available</div>
                    ) : (
                      vocabSets.map((set) => (
                        <SheetClose asChild key={set.id}>
                          <button
                            onClick={() => onSelectSet?.(set.id)}
                            className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition ${
                              set.id === selectedSetId
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            {set.name}{set.words ? ` (${set.words.length})` : ""}
                          </button>
                        </SheetClose>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="w-10" aria-hidden />
          )}
        </div>

        {/* Desktop/Tablet */}
        <div className="hidden md:flex items-center justify-between gap-6">
          <HamburgerMenu />
          <div className="flex-1 min-w-0">
            {subtitle && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">{subtitle}</div>
            )}
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight drop-shadow-sm">{title}</h1>
            {description && <p className="mt-1.5 max-w-3xl text-base text-indigo-50/90 leading-snug">{description}</p>}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {showVocabSetSelector && (
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md shadow-md hidden md:block">
                <label htmlFor="vocab-set-selector" className="sr-only">Vocabulary set</label>
                <select
                  id="vocab-set-selector"
                  value={selectedSetId}
                  onChange={(e) => onSelectSet?.(e.target.value)}
                  className={cn("h-11 min-w-[240px] rounded-lg bg-transparent text-[15px] text-white/95 outline-none","focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0")}
                >
                  {vocabSets.length === 0 ? (
                    <option value="" disabled className="text-slate-800">No vocabulary sets available</option>
                  ) : (
                    vocabSets.map((set) => (
                      <option key={set.id} value={set.id} className="text-slate-900">
                        {set.name}{set.words ? ` (${set.words.length})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            {showVocabSetSelector && isLoading && (
              <span className="hidden md:inline text-sm text-white/80">Loading words…</span>
            )}
            {rightSlot}
          </div>
        </div>

        {/* Mobile selector */}
        {/* Mobile selector moved into a bottom sheet; no extra header height */}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" aria-hidden />
    </header>
  );
}
