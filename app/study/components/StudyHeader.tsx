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
    <header className="sticky top-3 z-20 rounded-xl border border-slate-200/60 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">Study Flashcards</h1>
          </div>
          
          <div className="flex-shrink-0">
            <select
              value={selectedSetId}
              onChange={(event) => onSelectSet(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {vocabSets.length === 0 ? (
                <option value="">No vocabulary sets available</option>
              ) : (
                vocabSets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                    {set.words ? ` (${set.words.length})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {totalWords > 0 && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
            {masterySegments
              .filter((segment) => segment.percentage > 0)
              .map((segment, index, array) => {
                return (
                  <div
                    key={segment.level}
                    className={`relative h-full transition-[width] duration-500 ease-out ${
                      MASTERY_SEGMENT_BG[segment.level]
                    } ${index !== array.length - 1 ? "border-r border-white" : ""}`}
                    style={{ width: `${segment.percentage}%` }}
                    aria-label={`${segment.label}: ${segment.count} words`}
                    title={`${segment.label}: ${segment.count} words (${Math.round(segment.percentage)}%)`}
                  />
                );
              })}
          </div>
        </div>
      )}
    </header>
  );
}
