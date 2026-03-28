// lib/data/images.ts
'use server';

import { prisma } from '@/lib/prisma';
import { cacheProfiles } from './cache';
import { cacheTag } from 'next/cache';

export async function getExampleImage(exampleId: string) {
  'use cache';
  cacheProfiles.generatedImages(); // cached for days
  cacheTag(`example-image-${exampleId}`);
  
  return prisma.vocabExample.findUnique({
    where: { id: exampleId },
    select: { imageUrl: true, sentence: true },
  });
}
