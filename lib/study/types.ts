import type { MasteryLevel, StudyProgress, VocabSet, VocabWord, SimpleProgressState } from "@/lib/types";

export type FetchState = "idle" | "loading" | "error";

export type VocabSetSummary = Pick<VocabSet, "id" | "name" | "description" | "grade"> & {
  words?: Array<Pick<VocabWord, "id" | "word">>;
};

export type WordWithRelations = VocabWord & {
  examples?: NonNullable<VocabWord["examples"]>;
  progress?: StudyProgress[];
};

export type MasterySummary = Record<MasteryLevel, number>;

export interface MasterySegment {
  level: MasteryLevel;
  label: string;
  count: number;
  percentage: number;
}

export interface SimpleSegment {
  key: SimpleProgressState;
  label: string;
  count: number;
  percentage: number;
}
