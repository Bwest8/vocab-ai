'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VocabSet, VocabWord, VocabExample } from '@/lib/types';

interface VocabSetWithWords extends VocabSet {
  words: Array<VocabWord & { examples: VocabExample[] }>;
}

type EditableWord = VocabWord & {
  examples?: VocabExample[];
  vocabSet?: {
    id: string;
    name: string;
    grade: string | null;
  };
};

type ManagedWord = VocabWord & {
  vocabSet: {
    id: string;
    name: string;
    grade: string | null;
  };
};

export default function ManagePage() {
  const router = useRouter();
  const [vocabSets, setVocabSets] = useState<VocabSetWithWords[]>([]);
  const [selectedSet, setSelectedSet] = useState<VocabSetWithWords | null>(null);
  const [selectedWord, setSelectedWord] = useState<EditableWord | null>(null);
  const [allWords, setAllWords] = useState<ManagedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordsRefreshing, setWordsRefreshing] = useState(false);
  const [editMode, setEditMode] = useState<'set' | 'word' | null>(null);
  const [editSource, setEditSource] = useState<'set' | 'library' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'set' | 'word'; id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'sets' | 'words'>('sets');
  const [wordSearch, setWordSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | string>('all');
  const [setFilter, setSetFilter] = useState<'all' | string>('all');
  const [expandedExamples, setExpandedExamples] = useState<Record<string, boolean>>({});

  // Form states
  const [setForm, setSetForm] = useState({ name: '', description: '', grade: '' });
  const [wordForm, setWordForm] = useState({
    word: '',
    definition: '',
    teacherDefinition: '',
    pronunciation: '',
    partOfSpeech: '',
  });

  // Computed values
  const gradeOptions = useMemo(() => {
    const grades = allWords.map(w => w.vocabSet.grade).filter(Boolean);
    return ['all', ...new Set(grades)];
  }, [allWords]);

  const setOptions = useMemo(() => {
    const sets = allWords.map(w => ({ id: w.vocabSet.id, name: w.vocabSet.name }));
    return [{ id: 'all', name: 'All sets' }, ...sets.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)];
  }, [allWords]);

  const filtersActive = wordSearch || gradeFilter !== 'all' || setFilter !== 'all';

  const filteredWords = useMemo(() => {
    return allWords.filter(word => {
      if (wordSearch && !word.word.toLowerCase().includes(wordSearch.toLowerCase())) return false;
      if (gradeFilter !== 'all' && word.vocabSet.grade !== gradeFilter) return false;
      if (setFilter !== 'all' && word.vocabSet.id !== setFilter) return false;
      return true;
    });
  }, [allWords, wordSearch, gradeFilter, setFilter]);

  useEffect(() => {
    fetchVocabSets();
    fetchAllWords();
  }, []);

  const fetchVocabSets = async () => {
    try {
      const response = await fetch('/api/vocab');
      const data = await response.json();
      setVocabSets(data);
    } catch (error) {
      console.error('Error fetching vocab sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllWords = async () => {
    try {
      const response = await fetch('/api/vocab/words');

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to fetch vocabulary words');
      }

      const data = await response.json();
      setAllWords(data);
      return data;
    } catch (error) {
      console.error('Error fetching vocab words:', error);
      return [];
    } finally {
      setWordsRefreshing(false);
    }
  };

  const handleSelectSet = async (setId: string) => {
    try {
      const response = await fetch(`/api/vocab/${setId}`);
      const data = await response.json();
      setSelectedSet(data);
      setSelectedWord(null);
      setEditMode(null);
    } catch (error) {
      console.error('Error fetching set details:', error);
    }
  };

  const handleEditSet = () => {
    if (!selectedSet) return;
    setSetForm({
      name: selectedSet.name,
      description: selectedSet.description || '',
      grade: selectedSet.grade || '',
    });
    setEditMode('set');
  };

  const handleUpdateSet = async () => {
    if (!selectedSet) return;
    
    try {
      const response = await fetch(`/api/vocab/${selectedSet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setForm),
      });

      if (response.ok) {
        await fetchVocabSets();
        await handleSelectSet(selectedSet.id);
        setEditMode(null);
      }
    } catch (error) {
      console.error('Error updating set:', error);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      const response = await fetch(`/api/vocab/${setId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to delete set');
      }

      setVocabSets((prev) => prev.filter((set) => set.id !== setId));
      setSelectedSet(null);
      setShowDeleteConfirm(null);
      setAllWords((prev) => prev.filter((word) => word.vocabSetId !== setId));
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const handleEditWord = (word: EditableWord, source: 'set' | 'library') => {
    setSelectedWord(word);
    setWordForm({
      word: word.word,
      definition: word.definition,
      teacherDefinition: word.teacherDefinition || '',
      pronunciation: word.pronunciation || '',
      partOfSpeech: word.partOfSpeech || '',
    });
    setEditMode('word');
    setEditSource(source);
  };

  const cancelWordEdit = () => {
    setSelectedWord(null);
    setEditMode(null);
    setEditSource(null);
  };

  const toggleExamples = (wordId: string) => {
    setExpandedExamples((prev) => ({
      ...prev,
      [wordId]: !prev[wordId],
    }));
  };

  const handleUpdateWord = async () => {
    if (!selectedWord) return;

    try {
      const response = await fetch(`/api/vocab/words/${selectedWord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordForm),
      });

      if (response.ok) {
        if (selectedSet) {
          await handleSelectSet(selectedSet.id);
        }
        await fetchAllWords();
        cancelWordEdit();
      }
    } catch (error) {
      console.error('Error updating word:', error);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    try {
      const response = await fetch(`/api/vocab/words/${wordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to delete word');
      }

      setAllWords((prev) => prev.filter((word) => word.id !== wordId));

      setSelectedSet((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          words: prev.words.filter((word) => word.id !== wordId),
        };
      });

      if (selectedWord?.id === wordId) {
        cancelWordEdit();
      }

      setExpandedExamples((prev) => {
        if (!prev[wordId]) return prev;
        const { [wordId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-base md:text-lg">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 py-4 px-3 md:py-8 md:px-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Vocabulary Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage your child's vocabulary sets and words. Keep track of definitions, pronunciations, and examples.
          </p>
        </header>

        <div className="lg:flex lg:gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80 space-y-4 md:space-y-6 mb-6 lg:mb-0">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">Vocabulary Sets</h2>
              {vocabSets.length === 0 ? (
                <div className="text-center py-6 md:py-8 text-slate-500">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-sm">No sets yet. Create your first set from the Create page.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {vocabSets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => handleSelectSet(set.id)}
                      className={`w-full text-left p-3 md:p-4 rounded-lg border transition-all duration-200 ${
                        selectedSet?.id === set.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium text-sm md:text-base">{set.name}</div>
                      <div className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span>{set.words.length} words</span>
                        {set.grade && (
                          <>
                            <span>•</span>
                            <span>Grade {set.grade}</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSet && (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-4">Set Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEditSet}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm md:text-base"
                  >
                    Edit Set Details
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm({ type: 'set', id: selectedSet.id })}
                    className="w-full px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm md:text-base"
                  >
                    Delete Set
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-4 md:space-y-6">
            {!selectedSet ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-8 md:p-12 text-center">
                <div className="text-4xl md:text-5xl mb-4">📚</div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900">Select a vocabulary set</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Choose a set from the sidebar to view and manage its words.
                </p>
              </div>
            ) : (
              <>
                {/* Set Header */}
                <section className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900">{selectedSet.name}</h2>
                      {selectedSet.description && (
                        <p className="mt-2 text-sm text-slate-600">{selectedSet.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium">
                          📖 {selectedSet.words.length} words
                        </span>
                        {selectedSet.grade ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                            🎓 Grade {selectedSet.grade}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                            ✏️ Add grade level
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Words List */}
                <section className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h3 className="text-lg md:text-xl font-semibold text-slate-900">Words in this set</h3>
                  </div>

                  {selectedSet.words.length === 0 ? (
                    <div className="text-center py-6 md:py-8 text-slate-500">
                      <div className="text-4xl mb-3">📝</div>
                      <p className="text-sm">No words in this set yet. Add words from the Create page.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedSet.words.map((word) => {
                        const examplesExpanded = expandedExamples[word.id] ?? false;
                        const hasExamples = word.examples.length > 0;

                        return (
                          <div
                            key={word.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-lg md:text-xl font-bold text-indigo-600">{word.word}</h4>
                                  {word.partOfSpeech && (
                                    <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                      {word.partOfSpeech}
                                    </span>
                                  )}
                                  {word.pronunciation && (
                                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                      🔊 {word.pronunciation}
                                    </span>
                                  )}
                                </div>

                                {word.teacherDefinition && (
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Teacher definition</div>
                                    <p>{word.teacherDefinition}</p>
                                  </div>
                                )}

                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Definition</div>
                                  <p className="text-sm text-slate-700">{word.definition}</p>
                                </div>

                                {hasExamples && (
                                  <div className="rounded-lg border border-slate-200 bg-slate-50">
                                    <button
                                      type="button"
                                      onClick={() => toggleExamples(word.id)}
                                      className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 transition-colors"
                                      aria-expanded={examplesExpanded}
                                    >
                                      <span>Examples ({word.examples.length})</span>
                                      <span className="text-xs font-bold text-indigo-600">
                                        {examplesExpanded ? 'Hide' : 'Show'}
                                      </span>
                                    </button>
                                    {examplesExpanded && (
                                      <div className="space-y-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-700">
                                        {word.examples.map((example) => (
                                          <div
                                            key={example.id}
                                            className="rounded-lg border border-slate-200 bg-white p-3"
                                          >
                                            <p>{example.sentence}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 lg:items-end">
                                <button
                                  onClick={() => handleEditWord(word, 'set')}
                                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: 'word', id: word.id })}
                                  className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors min-h-[44px]"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>

        {/* Edit Set Modal */}
        {editMode === 'set' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setEditMode(null)}
            />
            <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-2xl">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Edit Set</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Set name *</label>
                  <input
                    type="text"
                    value={setForm.name}
                    onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={setForm.description}
                    onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Grade level</label>
                  <input
                    type="text"
                    value={setForm.grade}
                    onChange={(e) => setSetForm({ ...setForm, grade: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditMode(null)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSet}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-base min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Word Modal */}
        {editMode === 'word' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={cancelWordEdit}
            />
            <div className="relative z-50 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4">Edit Word</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Word *</label>
                  <input
                    type="text"
                    value={wordForm.word}
                    onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Part of speech</label>
                    <input
                      type="text"
                      value={wordForm.partOfSpeech}
                      onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                      placeholder="noun, verb, adjective..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pronunciation</label>
                    <input
                      type="text"
                      value={wordForm.pronunciation}
                      onChange={(e) => setWordForm({ ...wordForm, pronunciation: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                      placeholder="e.g., FLAW-less-lee"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher definition</label>
                  <textarea
                    value={wordForm.teacherDefinition}
                    onChange={(e) => setWordForm({ ...wordForm, teacherDefinition: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    rows={3}
                    placeholder="Add the teacher's explanation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Student definition *</label>
                  <textarea
                    value={wordForm.definition}
                    onChange={(e) => setWordForm({ ...wordForm, definition: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={cancelWordEdit}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-base min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWord}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-base min-h-[44px]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-2xl">
              <h2 className="text-base md:text-lg font-bold text-slate-900 mb-4">
                {showDeleteConfirm.type === 'set' ? 'Delete Set' : 'Delete Word'}
              </h2>
              <p className="text-slate-600 mb-6 text-sm md:text-base">
                {showDeleteConfirm.type === 'set'
                  ? 'This will permanently delete the set and all its words. This action cannot be undone.'
                  : 'This will permanently delete the word from all sets and games. This action cannot be undone.'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium text-base min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'set') {
                      handleDeleteSet(showDeleteConfirm.id);
                    } else {
                      handleDeleteWord(showDeleteConfirm.id);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-base min-h-[44px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
