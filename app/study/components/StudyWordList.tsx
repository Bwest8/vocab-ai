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
    <section className="rounded-3xl border border-white/40 bg-white/80 p-4 shadow-lg backdrop-blur-xl">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-700/80">Word List</h2>
          <p className="text-xs text-slate-500">Tap a card to jump around the lesson.</p>
        </div>
        <span className="text-xs font-semibold text-slate-400">{words.length} words</span>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4">
        {words.map((word, index) => {
          const progress = word.progress?.find((item) => item.userId == null);
          const mastery = toMasteryLevel(progress?.masteryLevel);
          const isActive = index === currentIndex;

          return (
            <button
              key={word.id}
              type="button"
              onClick={() => onSelectWord(index)}
              className={`group relative flex min-h-[68px] flex-col justify-between rounded-2xl border px-3 py-2 text-left shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-indigo-500/20"
                  : "border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:shadow"
              }`}
              aria-current={isActive}
            >
              <span className="absolute top-2 right-3 text-[11px] font-semibold text-slate-300">{index + 1}</span>
              <span className={`text-sm font-semibold tracking-tight ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                {word.word}
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <span className={`inline-block h-2 w-2 rounded-full ${MASTERY_COLORS[mastery]}`} />
                Mastery
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
