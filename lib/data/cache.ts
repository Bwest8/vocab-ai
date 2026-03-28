// lib/data/cache.ts
import { cacheLife } from 'next/cache';

// Cache profiles for vocab-ai data patterns
export const cacheProfiles = {
  // Vocabulary sets — change rarely, cache for hours
  vocabSets: () => cacheLife('hours'),
  
  // Word definitions — static once created
  wordDefinitions: () => cacheLife('hours'),
  
  // Generated images — expensive, cache for days
  generatedImages: () => cacheLife('days'),
  
  // User progress — changes frequently, short cache
  userProgress: () => cacheLife('minutes'),
  
  // Game state — very dynamic, minimal caching
  gameState: () => cacheLife('seconds'),
} as const;

// Cache tag helpers for invalidation
export const cacheTags = {
  vocabSets: 'vocab-sets',
  vocabSet: (id: string) => `vocab-set-${id}`,
  words: (setId: string) => `words-${setId}`,
  word: (wordId: string) => `word-${wordId}`,
  userProgress: (userId: string) => `progress-${userId}`,
  images: (wordId: string) => `images-${wordId}`,
} as const;
