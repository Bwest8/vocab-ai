// Type definitions for Vocab AI

export interface VocabSet {
  id: string;
  name: string;
  description: string | null;
  grade: string | null;
  createdAt: Date;
  updatedAt: Date;
  words?: VocabWord[];
}

export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  teacherDefinition: string | null;
  pronunciation: string | null;
  partOfSpeech: string | null;
  vocabSetId: string;
  createdAt: Date;
  updatedAt: Date;
  vocabSet?: VocabSet;
  examples?: VocabExample[];
  progress?: StudyProgress[];
}

export interface VocabExample {
  id: string;
  sentence: string;
  imageDescription: string;
  imageUrl: string | null;
  wordId: string;
  word?: VocabWord;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyProgress {
  id: string;
  wordId: string;
  userId: string | null;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number; // 0-5
  lastStudied: Date;
  createdAt: Date;
  updatedAt: Date;
  word?: VocabWord;
}

export interface ParsedVocabWord {
  word: string;
  partOfSpeech?: string;
  definition?: string;
}

export interface ProcessVocabRequest {
  rawText: string;
  vocabSetName: string;
  description?: string;
  grade?: string;
}

export interface GeminiVocabResponse {
  WORD: string;
  DEFINITION: string;
  TEACHER_DEFINITION: string;
  PRONUNCIATION: string;
  PART_OF_SPEECH: string;
  EXAMPLES: Array<{
    sentence: string;
    image_description: string;
  }>;
}

export interface ProcessVocabResponse {
  success: boolean;
  vocabSet: {
    id: string;
    name: string;
  };
  processedWords: number;
  totalWords: number;
  words: VocabWord[];
  errors?: Array<{
    word: string;
    error: string;
  }>;
}

export interface UpdateProgressRequest {
  wordId: string;
  isCorrect: boolean;
  userId?: string | null;
}

export interface UpdateProgressResponse {
  success: boolean;
  progress: StudyProgress;
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: 'Not Learned',
  1: 'Seen Once',
  2: 'Learning',
  3: 'Familiar',
  4: 'Mastered',
  5: 'Expert',
};

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  0: 'bg-gray-200 text-gray-700',
  1: 'bg-red-200 text-red-700',
  2: 'bg-orange-200 text-orange-700',
  3: 'bg-yellow-200 text-yellow-700',
  4: 'bg-green-200 text-green-700',
  5: 'bg-emerald-200 text-emerald-700',
};
