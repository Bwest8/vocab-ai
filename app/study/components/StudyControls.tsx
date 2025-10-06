interface StudyControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onMarkIncorrect: () => void;
  onMarkCorrect: () => void;
  disabled: boolean;
  className?: string;
}

export function StudyControls({
  onPrevious,
  onNext,
  onMarkIncorrect,
  onMarkCorrect,
  disabled,
  className = "",
}: StudyControlsProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      {/* Mastery Buttons - now responsive grid to reduce vertical height */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onMarkIncorrect}
          disabled={disabled}
          className="group relative flex items-center gap-2 rounded-lg border-2 border-rose-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:shadow-md active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 w-full"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-100 group-hover:bg-rose-200 transition-colors flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-tight flex-1">
            <span className="text-[13px] font-semibold text-rose-700">Still Learning</span>
            <span className="text-[11px] text-rose-600">Review again</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onMarkCorrect}
          disabled={disabled}
          className="group relative flex items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-2.5 shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 w-full"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-tight flex-1">
            <span className="text-[13px] font-semibold text-white">Know It Well</span>
            <span className="text-[11px] text-emerald-50">Mark mastered</span>
          </div>
        </button>
      </div>

      {/* Navigation Controls - kept compact */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200 hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[11px] uppercase tracking-wide">Prev</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2.5 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200 hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <span className="text-[11px] uppercase tracking-wide">Next</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
