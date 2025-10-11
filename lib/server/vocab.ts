/**
 * Server-only helpers for vocab data access.
 *
 * Import these from server components or server actions only. They use the Prisma
 * client and must not be imported into client bundles.
 */
import { prisma } from "@/lib/prisma";

export async function getVocabSets() {
  return await prisma.vocabSet.findMany({
    include: {
      words: {
        select: {
          id: true,
          word: true,
        },
        take: 0, // keeps shape but avoids loading lots of nested fields; callers can request details separately
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVocabSetById(id: string) {
  return await prisma.vocabSet.findUnique({
    where: { id },
    include: {
      words: {
        include: {
          examples: true,
          progress: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getVocabSetSummaryList() {
  // returns a lightweight list suitable for headers/selectors
  return await prisma.vocabSet.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { words: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
