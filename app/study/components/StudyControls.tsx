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
      className={`flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      <div className="flex items-center justify-center gap-3 sm:justify-start">
        <button
          type="button"
          onClick={onPrevious}
          className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-5 py-3 text-base font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <span className="text-xl">‹</span>
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-5 py-3 text-base font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Next
          <span className="text-xl">›</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onMarkIncorrect}
          disabled={disabled}
          className="flex min-w-[11rem] items-center justify-center gap-2 rounded-full border-2 border-rose-300 bg-white px-6 py-3 text-base font-semibold text-rose-500 shadow-sm transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          I Need Practice
        </button>
        <button
          type="button"
          onClick={onMarkCorrect}
          disabled={disabled}
          className="flex min-w-[11rem] items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-400/40 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          I Knew It
        </button>
      </div>
    </div>
  );
}
