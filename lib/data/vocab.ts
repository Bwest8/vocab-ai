// lib/data/vocab.ts
'use server';

import { prisma } from '@/lib/prisma';
import { cacheProfiles, cacheTags } from './cache';
import { cacheTag } from 'next/cache';

// Cached: Get all vocabulary sets (rarely changes)
export async function getVocabSets() {
  'use cache';
  cacheProfiles.vocabSets();
  cacheTag(cacheTags.vocabSets);
  
  return prisma.vocabSet.findMany({
    include: {
      words: {
        select: { id: true, word: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Cached: Get single vocab set with words
export async function getVocabSetWithWords(id: string) {
  'use cache';
  cacheProfiles.vocabSets();
  cacheTag(cacheTags.vocabSet(id));
  cacheTag(cacheTags.words(id));
  
  return prisma.vocabSet.findUnique({
    where: { id },
    include: {
      words: {
        include: {
          examples: true,
          progress: {
            where: { userId: null }, // Global progress for now
          },
        },
      },
    },
  });
}

// Cached: Get word details
export async function getWordDetails(wordId: string) {
  'use cache';
  cacheProfiles.wordDefinitions();
  cacheTag(cacheTags.word(wordId));
  
  return prisma.vocabWord.findUnique({
    where: { id: wordId },
    include: {
      examples: true,
      progress: true,
    },
  });
}
