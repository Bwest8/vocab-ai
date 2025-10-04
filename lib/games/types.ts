export type GameMode =
  | "definition-match"
  | "reverse-definition"
  | "fill-in-the-blank"
  | "speed-round"
  | "spelling"
  | "example-sentence";

export interface ModeStats {
  attempted: number;
  correct: number;
}

export interface GameProfileSummary {
  id: string;
  profileKey: string;
  points: number;
  questionsAttempted: number;
  questionsCorrect: number;
  streak: number;
  currentCombo: number;
  bestCombo: number;
  lastPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameModeProgressRecord {
  id: string;
  profileId: string;
  vocabSetId: string;
  mode: GameMode;
  attempted: number;
  correct: number;
  lastPlayedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameProfileResponse {
  profile: GameProfileSummary;
  modeProgress: GameModeProgressRecord[];
}

export interface GameResultPayload {
  mode: GameMode;
  correct: boolean;
  pointsAwarded: number;
  timeRemaining?: number;
}
