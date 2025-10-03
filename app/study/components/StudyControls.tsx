interface StudyControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onMarkIncorrect: () => void;
  onMarkCorrect: () => void;
  disabled: boolean;
}

export function StudyControls({
  onPrevious,
  onNext,
  onMarkIncorrect,
  onMarkCorrect,
  disabled,
}: StudyControlsProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-4 items-center justify-between">
      <div className="flex gap-3">
        <button
          onClick={onPrevious}
          className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onMarkIncorrect}
          disabled={disabled}
          className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-red-400 text-red-500 font-semibold hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          I Need Practice
        </button>
        <button
          onClick={onMarkCorrect}
          disabled={disabled}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          I Knew It
        </button>
      </div>
    </div>
  );
}
