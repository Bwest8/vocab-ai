import { getVocabSets, getVocabSetWithWords } from '@/lib/data/vocab';
import { StudyPageClient } from './StudyPageClient';

interface StudyPageProps {
  searchParams: Promise<{ set?: string }>;
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  // Cached: All vocab sets (loaded once, cached for hours)
  const vocabSets = await getVocabSets();
  
  // Determine which set to show
  const params = await searchParams;
  const selectedSetId = params.set || vocabSets[0]?.id;
  
  // Cached: Words for selected set (cached per set ID)
  const selectedSet = selectedSetId 
    ? await getVocabSetWithWords(selectedSetId)
    : null;
  
  return (
    <StudyPageClient 
      initialVocabSets={vocabSets} 
      initialSet={selectedSet}
    />
  );
}
