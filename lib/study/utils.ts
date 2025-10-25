import { MASTERY_LABELS, SIMPLE_STATE_LABELS, type MasteryLevel, type StudyProgress, type SimpleProgressState } from "@/lib/types";
import type { MasterySegment, MasterySummary, SimpleSegment, WordWithRelations } from "./types";

export function toMasteryLevel(level?: number | null): MasteryLevel {
  const safeValue = Math.max(0, Math.min(5, Number.isFinite(level ?? NaN) ? Math.round(level as number) : 0));
  return safeValue as MasteryLevel;
}

export function upsertProgressList(list: StudyProgress[] | undefined, updated: StudyProgress) {
  const filtered = (list ?? []).filter((item) => item.userId !== updated.userId);
  return [updated, ...filtered];
}

export function createMasterySummary(words: WordWithRelations[]): MasterySummary {
  const base: MasterySummary = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return words.reduce<MasterySummary>((acc, word) => {
    const progress = word.progress?.find((item) => item.userId == null);
    const level = toMasteryLevel(progress?.masteryLevel);
    acc[level] += 1;
    return acc;
  }, { ...base });
}

// Map full 0-5 mastery into simplified child-friendly states
export function toSimpleState(level?: number | null): SimpleProgressState {
  const mastery = toMasteryLevel(level);
  if (mastery <= 1) return 'learn';
  if (mastery <= 3) return 'grow';
  return 'know';
}

export function buildSimpleSegments(words: WordWithRelations[]): SimpleSegment[] {
  const counts: Record<SimpleProgressState, number> = { learn: 0, grow: 0, know: 0 };
  const total = words.length || 1;

  for (const word of words) {
    const progress = word.progress?.find((p) => p.userId == null);
    const state = toSimpleState(progress?.masteryLevel);
    counts[state] += 1;
  }

  return (Object.keys(counts) as SimpleProgressState[]).map((key) => ({
    key,
    label: SIMPLE_STATE_LABELS[key],
    count: counts[key],
    percentage: (counts[key] / (total || 1)) * 100,
  }));
}

export function buildMasterySegments(words: WordWithRelations[]): MasterySegment[] {
  const summary = createMasterySummary(words);
  const totalWords = words.length;

  return (Object.entries(MASTERY_LABELS) as Array<[`${MasteryLevel}`, string]>).map(([levelKey, label]) => {
    const level = Number(levelKey) as MasteryLevel;
    const count = summary[level] ?? 0;
    const percentage = totalWords > 0 ? (count / totalWords) * 100 : 0;
    return {
      level,
      label,
      count,
      percentage,
    } satisfies MasterySegment;
  });
}
