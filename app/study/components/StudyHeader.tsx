import type { MasterySegment, VocabSetSummary } from "@/lib/study/types";

const MASTERY_SEGMENT_BG: Record<number, string> = {
  0: "bg-gray-300",
  1: "bg-red-300",
  2: "bg-orange-300",
  3: "bg-yellow-300",
  4: "bg-green-300",
  5: "bg-emerald-400",
};

interface StudyHeaderProps {
  vocabSets: VocabSetSummary[];
  selectedSetId: string;
  onSelectSet: (setId: string) => void;
  masterySegments: MasterySegment[];
  totalWords: number;
}

export function StudyHeader({
  vocabSets,
  selectedSetId,
  onSelectSet,
  masterySegments,
  totalWords,
}: StudyHeaderProps) {
  return (
    <header className="sticky top-3 z-20 rounded-3xl border border-white/60 bg-white/75 px-4 py-3 shadow-lg shadow-indigo-100/60 backdrop-blur-md md:px-6 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Study Flashcards</h1>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-indigo-300">Review &amp; master your vocabulary</p>
        </div>

        <div className="w-full max-w-xs md:max-w-sm">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Vocabulary Set
          </label>
          <select
            value={selectedSetId}
            onChange={(event) => onSelectSet(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-indigo-100 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {vocabSets.length === 0 ? (
              <option value="">No vocabulary sets available</option>
            ) : (
              vocabSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                  {set.words ? ` (${set.words.length} words)` : ""}
                  {set.grade ? ` - Grade ${set.grade}` : ""}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {totalWords > 0 && (
        <div className="mt-3 md:mt-4">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.25em] text-slate-400">
            <span>Mastery Progress</span>
            <span className="text-slate-500">{totalWords} words</span>
          </div>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full border border-indigo-100 bg-indigo-50">
            {masterySegments
              .filter((segment) => segment.percentage > 0)
              .map((segment, index, array) => {
                const showCount = segment.percentage >= 14;
                return (
                  <div
                    key={segment.level}
                    className={`relative h-full transition-[width] duration-500 ease-out ${
                      MASTERY_SEGMENT_BG[segment.level]
                    } ${index !== array.length - 1 ? "border-r border-white/60" : ""}`}
                    style={{ width: `${segment.percentage}%` }}
                    aria-label={`${segment.label}: ${segment.count} words`}
                  >
                    {showCount ? (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-slate-800">
                        {segment.count}
                      </span>
                    ) : (
                      <span className="sr-only">{`${segment.label}: ${segment.count} words`}</span>
                    )}
                  </div>
                );
              })}
          </div>
          <div className="mt-2 -mx-1 overflow-x-auto">
            <ul className="flex flex-nowrap items-center gap-2 px-1 text-[11px] text-slate-500">
              {masterySegments.map((segment) => (
                <li
                  key={segment.level}
                  className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-sm shadow-white/60"
                >
                  <span className={`h-2 w-5 shrink-0 rounded-full ${MASTERY_SEGMENT_BG[segment.level]}`} />
                  <span className="font-semibold text-slate-600">{segment.label}</span>
                  <span className="text-slate-400">({segment.count})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
