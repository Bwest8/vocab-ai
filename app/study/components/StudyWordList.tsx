'use client';

import { toSimpleState } from "@/lib/study/utils";
import { SIMPLE_STATE_COLORS_BG, SIMPLE_STATE_LABELS } from "@/lib/types";
import type { WordWithRelations } from "@/lib/study/types";
import { useEffect, useRef } from "react";

interface StudyWordListProps {
  words: WordWithRelations[];
  currentIndex: number;
  onSelectWord: (index: number) => void;
}

export function StudyWordList({ words, currentIndex, onSelectWord }: StudyWordListProps) {
  if (words.length === 0) {
    return null;
  }

  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  return (
    <section className="rounded-3xl border border-white/40 bg-white/80 px-3 py-3 shadow-lg backdrop-blur-xl">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Words</h2>
        <span className="text-xs font-semibold text-slate-400">{words.length}</span>
      </header>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
        {words.map((word, index) => {
          const progress = word.progress?.find((item) => item.userId == null);
          const state = toSimpleState(progress?.masteryLevel);
          const isActive = index === currentIndex;

          return (
            <button
              key={word.id}
              type="button"
              onClick={() => onSelectWord(index)}
              className={`group relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isActive
                  ? "border-indigo-400 bg-indigo-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
              }`}
              aria-current={isActive}
              ref={isActive ? activeRef : undefined}
            >
              <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${SIMPLE_STATE_COLORS_BG[state]}`} />
              <span className={`text-base font-bold leading-tight ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                {word.word}
              </span>
              <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {SIMPLE_STATE_LABELS[state]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
