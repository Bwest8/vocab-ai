import { getVocabSets } from '@/lib/data/vocab';
import { ManagePageClient } from './ManagePageClient';

export default async function ManagePage() {
  // Cached vocab sets for initial render
  const vocabSets = await getVocabSets();
  
  return <ManagePageClient initialVocabSets={vocabSets} />;
}
