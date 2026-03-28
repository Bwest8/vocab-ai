import { getVocabSets } from '@/lib/data/vocab';

interface VocabSetSelectorProps {
  selectedSetId?: string;
  onSelectSet?: (setId: string) => void;
}

export async function VocabSetSelector({ selectedSetId, onSelectSet }: VocabSetSelectorProps) {
  // This data is automatically cached per cacheLife profile
  const vocabSets = await getVocabSets();
  
  return (
    <select 
      name="vocabSet" 
      defaultValue={selectedSetId}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {vocabSets.map((set) => (
        <option key={set.id} value={set.id}>
          {set.name} ({set.words.length} words)
        </option>
      ))}
    </select>
  );
}
