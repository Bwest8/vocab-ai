import { MASTERY_LABELS, type MasteryLevel, type StudyProgress } from "@/lib/types";
import type { MasterySegment, MasterySummary, WordWithRelations } from "./types";

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
