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
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Study Flashcards</h1>
          <p className="text-sm text-gray-600 mt-1">Review vocabulary and track your mastery progress</p>
        </div>

        <div className="flex-shrink-0 md:w-80">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Vocabulary Set</label>
          <select
            value={selectedSetId}
            onChange={(event) => onSelectSet(event.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-blue-500 transition-colors"
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
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span className="font-semibold uppercase tracking-widest">Mastery Progress</span>
            <span className="font-medium text-gray-700">{totalWords} words</span>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
            {masterySegments
              .filter((segment) => segment.percentage > 0)
              .map((segment, index, array) => {
                const showCount = segment.percentage >= 12;
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
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-900">
                        {segment.count}
                      </span>
                    ) : (
                      <span className="sr-only">{`${segment.label}: ${segment.count} words`}</span>
                    )}
                  </div>
                );
              })}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
            {masterySegments.map((segment) => (
              <div key={segment.level} className="flex items-center gap-2">
                <span className={`h-2 w-6 rounded-full ${MASTERY_SEGMENT_BG[segment.level]}`} />
                <span className="font-medium text-gray-700">{segment.label}</span>
                <span className="text-gray-500">({segment.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
