"use client";

import { ReactNode } from "react";

interface QuestionCardProps {
  children: ReactNode;
  showSkip?: boolean;
  onSkip?: () => void;
  className?: string;
}

export function QuestionCard({ children, showSkip = false, onSkip, className = "" }: QuestionCardProps) {
  return (
    <div className={`rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl backdrop-blur-sm landscape:rounded-2xl landscape:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">{children}</div>
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-bold uppercase tracking-wide text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-95 landscape:px-3 landscape:py-1.5 landscape:text-xs"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
