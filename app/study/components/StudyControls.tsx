interface StudyControlsProps {
  onMarkIncorrect: () => void;
  onMarkCorrect: () => void;
  disabled: boolean;
  className?: string;
}

export function StudyControls({
  onMarkIncorrect,
  onMarkCorrect,
  disabled,
  className = "",
}: StudyControlsProps) {
  // Basic swipe support for iPad: swipe left = Needs Practice, swipe right = Got It
  let touchStartX = 0;
  let touchEndX = 0;

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX = e.changedTouches[0].clientX;
  };
  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchEndX = e.changedTouches[0].clientX;
  };
  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    const dx = touchEndX - touchStartX;
    const threshold = 50; // px
    if (dx <= -threshold && !disabled) {
      onMarkIncorrect();
    } else if (dx >= threshold && !disabled) {
      onMarkCorrect();
    }
  };

  return (
    <div
      className={`flex w-full flex-col gap-2 ${className}`.trim()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          onClick={onMarkIncorrect}
          disabled={disabled}
          className="group relative flex items-center justify-center gap-3 rounded-2xl border-2 border-amber-300 bg-white px-4 py-5 shadow-sm transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-md active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors flex-shrink-0">
            <span className="text-2xl" aria-hidden>🧠</span>
          </div>
          <div className="flex flex-col items-start leading-tight flex-1">
            <span className="text-base font-extrabold text-amber-800">Needs Practice</span>
            <span className="text-xs text-amber-700">Try again</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onMarkCorrect}
          disabled={disabled}
          className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-5 shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex-shrink-0">
            <span className="text-2xl" aria-hidden>✅</span>
          </div>
          <div className="flex flex-col items-start leading-tight flex-1">
            <span className="text-base font-extrabold text-white">Got It</span>
            <span className="text-xs text-emerald-50">Auto next</span>
          </div>
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-500">Tip: swipe left for Needs Practice, right for Got It</p>
    </div>
  );
}
