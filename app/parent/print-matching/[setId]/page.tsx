import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ setId: string }>;
}

type PrintableWord = {
  id: string;
  word: string;
  teacherDefinition: string | null;
  definition: string | null;
};

export default async function PrintMatchingPage({ params }: PageProps) {
  const { setId } = await params;

  const vocabSet = await prisma.vocabSet.findUnique({
    where: { id: setId },
    include: {
      words: {
        select: {
          id: true,
          word: true,
          teacherDefinition: true,
          definition: true,
        },
        orderBy: {
          word: 'asc',
        },
      },
    },
  });

  if (!vocabSet) {
    notFound();
  }

  // Chunk words into groups of 3 for each 3x2 grid
  const chunkedWords: PrintableWord[][] = [];
  for (let i = 0; i < vocabSet.words.length; i += 3) {
    chunkedWords.push(vocabSet.words.slice(i, i + 3));
  }

  return (
    <div className={styles.printContainer}>
      {chunkedWords.map((chunk, pageIndex) => (
        <div key={pageIndex} className={pageIndex > 0 ? styles.pageBreak : ''}>
          <div className={styles.grid}>
            <div className={styles.wordColumn}>
              {chunk.map((word: PrintableWord) => (
                <div key={word.id} className={styles.wordCard}>
                  {word.word}
                </div>
              ))}
              {/* Fill empty spots if less than 3 */}
              {Array.from({ length: 3 - chunk.length }).map((_, i) => (
                <div key={`empty-word-${i}`} className={styles.wordCard}></div>
              ))}
            </div>
            <div className={styles.defColumn}>
              {chunk.map((word: PrintableWord) => (
                <div key={`def-${word.id}`} className={styles.defCard}>
                  {word.teacherDefinition || word.definition}
                </div>
              ))}
              {/* Fill empty spots if less than 3 */}
              {Array.from({ length: 3 - chunk.length }).map((_, i) => (
                <div key={`empty-def-${i}`} className={styles.defCard}></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}