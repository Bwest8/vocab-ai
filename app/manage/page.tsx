'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import type { VocabSet, VocabWord, VocabExample } from '@/lib/types';
import {
  BookOpenCheck,
  ChevronDown,
  Filter,
  GraduationCap,
  ImageOff,
  LibrarySquare,
  ListChecks,
  Loader2,
  PencilLine,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';

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
  const [resettingSetImages, setResettingSetImages] = useState(false);
  const [clearingExampleImageId, setClearingExampleImageId] = useState<string | null>(null);

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
    const grades = allWords
      .map(w => w.vocabSet.grade)
      .filter((grade): grade is string => Boolean(grade));
    return ['all', ...new Set(grades)];
  }, [allWords]);

  const setOptions = useMemo(() => {
    const sets = allWords.map(w => ({ id: w.vocabSet.id, name: w.vocabSet.name }));
    return [{ id: 'all', name: 'All sets' }, ...sets.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i)];
  }, [allWords]);

  const totalSets = vocabSets.length;
  const totalWords = allWords.length;

  const totalExamples = useMemo(() => {
    return vocabSets.reduce((sum, set) => {
      return (
        sum +
        set.words.reduce((wordSum, word) => {
          return wordSum + (word.examples?.length ?? 0);
        }, 0)
      );
    }, 0);
  }, [vocabSets]);

  const selectedSetExampleCount = useMemo(() => {
    if (!selectedSet) return 0;
    return selectedSet.words.reduce((sum, word) => sum + (word.examples?.length ?? 0), 0);
  }, [selectedSet]);

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

  const handleResetSetImages = async () => {
    if (!selectedSet) return;

    setResettingSetImages(true);

    try {
      const response = await fetch(`/api/vocab/${selectedSet.id}/images`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to reset set images');
      }

      await response.json().catch(() => null);

      setSelectedSet((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          words: prev.words.map((word) => ({
            ...word,
            examples: word.examples.map((example) => ({
              ...example,
              imageUrl: null,
            })),
          })),
        };
      });

      setSelectedWord((prev) => {
        if (!prev?.examples) return prev;

        return {
          ...prev,
          examples: prev.examples.map((example) => ({
            ...example,
            imageUrl: null,
          })),
        };
      });
    } catch (error) {
      console.error('Error resetting set images:', error);
    } finally {
      setResettingSetImages(false);
    }
  };

  const handleDeleteExampleImage = async (wordId: string, exampleId: string) => {
    if (!selectedSet) return;

    if (clearingExampleImageId) return;
    setClearingExampleImageId(exampleId);

    try {
      const response = await fetch(`/api/vocab/${selectedSet.id}/examples/${exampleId}/image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to delete example image');
      }

      setSelectedSet((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          words: prev.words.map((word) => {
            if (word.id !== wordId) return word;

            return {
              ...word,
              examples: word.examples.map((example) =>
                example.id === exampleId
                  ? {
                      ...example,
                      imageUrl: null,
                    }
                  : example
              ),
            };
          }),
        };
      });

      setSelectedWord((prev) => {
        if (!prev || prev.id !== wordId || !prev.examples) return prev;

        return {
          ...prev,
          examples: prev.examples.map((example) =>
            example.id === exampleId
              ? {
                  ...example,
                  imageUrl: null,
                }
              : example
          ),
        };
      });
    } catch (error) {
      console.error('Error deleting example image:', error);
    } finally {
      setClearingExampleImageId(null);
    }
  };

  const clearLibraryFilters = () => {
    setWordSearch('');
    setGradeFilter('all');
    setSetFilter('all');
  };

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-base md:text-lg">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Vocabulary Management"
        showVocabSetSelector={false}
      />

      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-6 md:pt-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-indigo-100 bg-white/95 p-5 shadow-sm shadow-indigo-100/40">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <BookOpenCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500/80">Total Sets</p>
                  <p className="text-2xl font-bold text-slate-900">{totalSets}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Active study collections</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <ListChecks className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500/80">Words Tracked</p>
                  <p className="text-2xl font-bold text-slate-900">{totalWords}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Ready for review and practice</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-sm shadow-emerald-100/40">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/80">Example Library</p>
                  <p className="text-2xl font-bold text-slate-900">{totalExamples}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">Illustrated learning moments</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-indigo-100/30 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Management Views</h2>
                <p className="text-sm text-slate-500">Navigate between curated sets and the full word library.</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('sets')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 md:px-5 ${
                    activeTab === 'sets'
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
                  }`}
                >
                  <LibrarySquare className="h-4 w-4" />
                  <span>Sets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('words')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 md:px-5 ${
                    activeTab === 'words'
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-700'
                  }`}
                >
                  <ListChecks className="h-4 w-4" />
                  <span>Word Library</span>
                </button>
              </div>
            </div>
          </section>

          {activeTab === 'sets' ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)]">
              {/* Sidebar */}
              <aside className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-900">
                      <LibrarySquare className="h-5 w-5 text-indigo-500" />
                      <h2 className="text-base font-semibold md:text-lg">Vocabulary Sets</h2>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {totalSets}
                    </span>
                  </div>
                  {vocabSets.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 md:py-8">
                      <div className="mb-3 text-4xl">📚</div>
                      <p className="text-sm">No sets yet. Create your first set from the Create page.</p>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col gap-2 md:max-h-[28rem] md:overflow-y-auto md:pr-1">
                      {vocabSets.map((set) => {
                        const isSelected = selectedSet?.id === set.id;

                        return (
                          <button
                            key={set.id}
                            onClick={() => handleSelectSet(set.id)}
                            className={`group flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200 md:px-5 ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-50 text-indigo-900 shadow-md ring-2 ring-indigo-100'
                                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold md:text-base">{set.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 md:text-sm">
                                <span className="inline-flex items-center gap-1.5">
                                  <BookOpenCheck className="h-3.5 w-3.5 text-indigo-500" />
                                  {set.words.length} words
                                </span>
                                {set.grade && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <GraduationCap className="h-3.5 w-3.5 text-slate-500" />
                                    Grade {set.grade}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedSet && (
                  <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30">
                    <h3 className="text-base font-semibold text-slate-900 md:text-lg">Set actions</h3>
                    <div className="mt-4 grid gap-2">
                      <button
                        onClick={handleEditSet}
                        className="flex w-full items-center justify-between rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg md:px-5"
                      >
                        <span className="flex items-center gap-2">
                          <PencilLine className="h-4 w-4" />
                          Edit set details
                        </span>
                      </button>
                      <button
                        onClick={handleResetSetImages}
                        disabled={resettingSetImages}
                        className="flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition-all duration-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 md:px-5"
                      >
                        <span className="flex items-center gap-2">
                          {resettingSetImages ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4" />
                          )}
                          Reset example images
                        </span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'set', id: selectedSet.id })}
                        className="flex w-full items-center justify-between rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-rose-700 hover:shadow-lg md:px-5"
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete set
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </aside>

              {/* Main Content */}
              <div className="space-y-6">
                {!selectedSet ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/95 p-12 text-center shadow-sm shadow-indigo-100/30 md:p-16">
                    <div className="mb-4 text-5xl md:text-6xl">📚</div>
                    <h3 className="text-xl font-semibold text-slate-900 md:text-2xl">Select a vocabulary set</h3>
                    <p className="mt-3 text-base text-slate-600">
                      Choose a set from the list to review, edit, or curate its words.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Set Header */}
                    <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30 md:p-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">{selectedSet.name}</h2>
                          {selectedSet.description && (
                            <p className="text-sm text-slate-600 md:text-base">{selectedSet.description}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                            <BookOpenCheck className="h-4 w-4" />
                            {selectedSet.words.length} words
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                            <GraduationCap className="h-4 w-4" />
                            {selectedSet.grade ? `Grade ${selectedSet.grade}` : 'Add grade level'}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                            <Sparkles className="h-4 w-4" />
                            {selectedSetExampleCount} examples
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* Words List */}
                    <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30 md:p-6">
                      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 md:text-xl">Words in this set</h3>
                          <p className="text-sm text-slate-500">
                            Expand a word to review pronunciation, examples, and supporting prompts.
                          </p>
                        </div>
                      </div>

                      {selectedSet.words.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                          <div className="mb-3 text-4xl">📝</div>
                          <p>Start building this set by adding words from the Create page.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedSet.words.map((word) => {
                            const examplesExpanded = expandedExamples[word.id] ?? false;
                            const hasExamples = word.examples.length > 0;
                            const hasTeacherDefinition = Boolean(word.teacherDefinition);
                            const definitionGridClass = hasTeacherDefinition ? 'md:grid-cols-2' : 'md:grid-cols-1';

                            return (
                              <div
                                key={word.id}
                                className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30 transition-all duration-200 hover:border-indigo-200 hover:shadow-lg"
                              >
                                <div className="space-y-5">
                                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0 flex-1 space-y-3">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <h4 className="text-lg font-semibold text-slate-900 md:text-xl">{word.word}</h4>
                                        {word.partOfSpeech && (
                                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                            {word.partOfSpeech}
                                          </span>
                                        )}
                                        {word.pronunciation && (
                                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                            {word.pronunciation}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 md:justify-end">
                                      <button
                                        onClick={() => handleEditWord(word, 'set')}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
                                      >
                                        <PencilLine className="h-4 w-4" />
                                        Edit word
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteConfirm({ type: 'word', id: word.id })}
                                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-100"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                    </div>
                                  </div>

                                  <div className={`grid grid-cols-1 gap-3 ${definitionGridClass}`}>
                                    {hasTeacherDefinition && (
                                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                          Teacher definition
                                        </p>
                                        <p className="mt-2">{word.teacherDefinition}</p>
                                      </div>
                                    )}

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                        Student definition
                                      </p>
                                      <p className="mt-2">{word.definition}</p>
                                    </div>
                                  </div>

                                  {hasExamples && (
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => toggleExamples(word.id)}
                                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                                        aria-expanded={examplesExpanded}
                                      >
                                        <span className="inline-flex items-center gap-2">
                                          <ListChecks className="h-4 w-4 text-indigo-500" />
                                          Examples ({word.examples.length})
                                        </span>
                                        <ChevronDown
                                          className={`h-4 w-4 text-slate-500 transition-transform ${
                                            examplesExpanded ? 'rotate-180' : ''
                                          }`}
                                        />
                                      </button>
                                        {examplesExpanded && (
                                          <div className="mt-4 space-y-3">
                                            {word.examples.map((example, index) => {
                                              const hasImage = Boolean(example.imageUrl);
                                              const hasDescription = Boolean(example.imageDescription);

                                              return (
                                                <div
                                                  key={example.id}
                                                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
                                                >
                                                  <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                      <p className="text-sm text-slate-700">
                                                        <span className="font-semibold text-slate-900">
                                                          Example {index + 1}.
                                                        </span>{' '}
                                                        {example.sentence}
                                                      </p>
                                                      {hasImage && (
                                                        <button
                                                          type="button"
                                                          onClick={() => handleDeleteExampleImage(word.id, example.id)}
                                                          disabled={Boolean(clearingExampleImageId)}
                                                          title="Delete this example's image"
                                                          className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                          {clearingExampleImageId === example.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                          ) : (
                                                            <>
                                                              <Trash2 className="h-3.5 w-3.5" />
                                                              <span>Remove image</span>
                                                            </>
                                                          )}
                                                        </button>
                                                      )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                      <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                          hasImage
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-slate-300 bg-slate-100 text-slate-600'
                                                        }`}
                                                      >
                                                        {hasImage ? 'Image ready' : 'No image yet'}
                                                      </span>
                                                      {hasDescription && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                                                          Prompt included
                                                        </span>
                                                      )}
                                                    </div>
                                                    {hasDescription && (
                                                      <p className="text-xs text-slate-500">{example.imageDescription}</p>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
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
          ) : (
          <section className="space-y-5 md:space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30 md:p-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Word Library</h2>
                    <p className="text-sm text-slate-500">
                      Search across every set to edit or jump directly to a collection.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                    <ListChecks className="h-4 w-4" />
                    Showing {filteredWords.length} of {totalWords}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)] md:items-start">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Search words</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={wordSearch}
                        onChange={(e) => setWordSearch(e.target.value)}
                        placeholder="Search by word, definition, or pronunciation"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 pl-11 text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Grade level</label>
                      <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        {gradeOptions.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade === 'all' ? 'All grade levels' : `Grade ${grade}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Set</label>
                      <select
                        value={setFilter}
                        onChange={(e) => setSetFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        {setOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.id === 'all' ? 'All sets' : option.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {filtersActive && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={clearLibraryFilters}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      <Filter className="h-4 w-4" />
                      Clear filters
                    </button>
                    <span className="text-sm text-slate-500">
                      {wordSearch && `Searching for “${wordSearch}”`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {filteredWords.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center shadow-lg shadow-indigo-100/30">
                  <div className="mb-3 text-5xl">🔍</div>
                  <h3 className="text-lg font-semibold text-slate-900 md:text-xl">No matches yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Adjust your search or filters to find the words you need.
                  </p>
                </div>
              ) : (
                filteredWords.map((word) => (
                  <div
                    key={word.id}
                    className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm shadow-indigo-100/30 transition-all duration-200 hover:border-indigo-200 hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-col gap-2 md:max-w-[70%]">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold text-slate-900 md:text-xl">{word.word}</h4>
                          {word.partOfSpeech && (
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                              {word.partOfSpeech}
                            </span>
                          )}
                        </div>
                        {word.definition && (
                          <p className="text-sm text-slate-600 md:text-base">{word.definition}</p>
                        )}
                        {word.teacherDefinition && (
                          <p className="text-xs text-slate-500 md:text-sm">
                            <span className="font-semibold text-slate-600">Teacher note: </span>
                            {word.teacherDefinition}
                          </p>
                        )}
                        {word.pronunciation && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                            {word.pronunciation}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row flex-wrap items-center gap-2 md:max-w-[30%] md:justify-end">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 whitespace-nowrap">
                          {word.vocabSet.name}
                        </span>
                        {word.vocabSet.grade && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 whitespace-nowrap">
                            Grade {word.vocabSet.grade}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditWord({ ...word, vocabSet: word.vocabSet }, 'library')}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit word
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('sets');
                          handleSelectSet(word.vocabSet.id);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all duration-200 hover:bg-indigo-100"
                      >
                        <LibrarySquare className="h-4 w-4" />
                        View set
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm({ type: 'word', id: word.id })}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition-all duration-200 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>

    {/* Edit Set Modal */}
        {editMode === 'set' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"
              onClick={() => setEditMode(null)}
            />
            <div className="relative z-50 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Edit Set</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Set name *</label>
                  <input
                    type="text"
                    value={setForm.name}
                    onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea
                    value={setForm.description}
                    onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Grade level</label>
                  <input
                    type="text"
                    value={setForm.grade}
                    onChange={(e) => setSetForm({ ...setForm, grade: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditMode(null)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-base min-h-[44px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSet}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-base min-h-[44px] transition-colors shadow-md"
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
              className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"
              onClick={cancelWordEdit}
            />
            <div className="relative z-50 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Edit Word</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Word *</label>
                  <input
                    type="text"
                    value={wordForm.word}
                    onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Part of speech</label>
                    <input
                      type="text"
                      value={wordForm.partOfSpeech}
                      onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                      placeholder="noun, verb, adjective..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pronunciation</label>
                    <input
                      type="text"
                      value={wordForm.pronunciation}
                      onChange={(e) => setWordForm({ ...wordForm, pronunciation: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                      placeholder="e.g., FLAW-less-lee"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teacher definition</label>
                  <textarea
                    value={wordForm.teacherDefinition}
                    onChange={(e) => setWordForm({ ...wordForm, teacherDefinition: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    rows={3}
                    placeholder="Add the teacher's explanation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Student definition *</label>
                  <textarea
                    value={wordForm.definition}
                    onChange={(e) => setWordForm({ ...wordForm, definition: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-base"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={cancelWordEdit}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-base min-h-[44px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWord}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-base min-h-[44px] transition-colors shadow-md"
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
              className="absolute inset-0 bg-slate-900/75 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <div className="relative z-50 w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 md:p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                  {showDeleteConfirm.type === 'set' ? 'Delete Set?' : 'Delete Word?'}
                </h2>
                <p className="text-slate-600 text-sm md:text-base">
                  {showDeleteConfirm.type === 'set'
                    ? 'This will permanently delete the set and all its words. This action cannot be undone.'
                    : 'This will permanently delete the word from all sets and games. This action cannot be undone.'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-base min-h-[44px] transition-colors"
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
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold text-base min-h-[44px] transition-colors shadow-md"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
