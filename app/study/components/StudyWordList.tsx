'use client';

import { toMasteryLevel } from "@/lib/study/utils";
import { MASTERY_COLORS } from "@/lib/types";
import type { WordWithRelations } from "@/lib/study/types";

interface StudyWordListProps {
  words: WordWithRelations[];
  currentIndex: number;
  onSelectWord: (index: number) => void;
}

export function StudyWordList({ words, currentIndex, onSelectWord }: StudyWordListProps) {
  if (words.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-white/40 bg-white/80 px-3 py-3 shadow-lg backdrop-blur-xl">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Words</h2>
        <span className="text-xs font-semibold text-slate-400">{words.length}</span>
      </header>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
        {words.map((word, index) => {
          const progress = word.progress?.find((item) => item.userId == null);
          const mastery = toMasteryLevel(progress?.masteryLevel);
          const isActive = index === currentIndex;

          return (
            <button
              key={word.id}
              type="button"
              onClick={() => onSelectWord(index)}
              className={`group relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isActive
                  ? "border-indigo-400 bg-indigo-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
              }`}
              aria-current={isActive}
            >
              <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${MASTERY_COLORS[mastery]}`} />
              <span className={`text-sm font-bold leading-tight ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                {word.word}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
