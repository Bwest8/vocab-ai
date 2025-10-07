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
    <div className={`flex w-full flex-col gap-3 ${className}`.trim()}>
      {/* Top Row - Mastery Buttons spanning full width */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onMarkIncorrect}
          disabled={disabled}
          className="group relative flex items-center justify-center gap-3 rounded-xl border-2 border-rose-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:shadow-md active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 w-full"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 group-hover:bg-rose-200 transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-tight flex-1">
            <span className="text-sm font-semibold text-rose-700">Still Learning</span>
            <span className="text-xs text-rose-600">Review again</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onMarkCorrect}
          disabled={disabled}
          className="group relative flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-4 shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 w-full"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-tight flex-1">
            <span className="text-sm font-semibold text-white">Know It Well</span>
            <span className="text-xs text-emerald-50">Mark mastered</span>
          </div>
        </button>
      </div>

      {/* Bottom Row - Navigation Controls spanning full width */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200 hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm uppercase tracking-wide">Previous</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-4 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200 hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <span className="text-sm uppercase tracking-wide">Next</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
