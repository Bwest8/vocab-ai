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
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <div className="flex items-center justify-center gap-3 sm:justify-start">
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className="text-lg">‹</span>
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Next
          <span className="text-lg">›</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onMarkIncorrect}
          disabled={disabled}
          className="flex min-w-[11rem] items-center justify-center gap-2 rounded-lg border-2 border-rose-300 bg-white px-6 py-2.5 text-sm font-semibold text-rose-600 shadow-sm transition hover:border-rose-400 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Need Practice
        </button>
        <button
          type="button"
          onClick={onMarkCorrect}
          disabled={disabled}
          className="flex min-w-[11rem] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          I Know This
        </button>
      </div>
    </div>
  );
}
