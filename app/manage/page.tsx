'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VocabSet, VocabWord, VocabExample } from '@/lib/types';

interface VocabSetWithWords extends VocabSet {
  words: Array<VocabWord & { examples: VocabExample[] }>;
}

export default function ManagePage() {
  const router = useRouter();
  const [vocabSets, setVocabSets] = useState<VocabSetWithWords[]>([]);
  const [selectedSet, setSelectedSet] = useState<VocabSetWithWords | null>(null);
  const [selectedWord, setSelectedWord] = useState<(VocabWord & { examples: VocabExample[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<'set' | 'word' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'set' | 'word'; id: string } | null>(null);
  const [imageDeleteState, setImageDeleteState] = useState<Record<string, boolean>>({});

  // Form states
  const [setForm, setSetForm] = useState({ name: '', description: '', grade: '' });
  const [wordForm, setWordForm] = useState({
    word: '',
    definition: '',
    pronunciation: '',
    partOfSpeech: '',
  });

  useEffect(() => {
    fetchVocabSets();
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

      if (response.ok) {
        await fetchVocabSets();
        setSelectedSet(null);
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const handleEditWord = (word: VocabWord & { examples: VocabExample[] }) => {
    setSelectedWord(word);
    setWordForm({
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation || '',
      partOfSpeech: word.partOfSpeech || '',
    });
    setEditMode('word');
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
        setEditMode(null);
        setSelectedWord(null);
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

      if (response.ok) {
        if (selectedSet) {
          await handleSelectSet(selectedSet.id);
        }
        setShowDeleteConfirm(null);
        setSelectedWord(null);
      }
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  const handleDeleteExampleImage = async (wordId: string, exampleId: string) => {
    if (!selectedSet) return;

    setImageDeleteState((prev) => ({ ...prev, [exampleId]: true }));

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
            if (word.id !== wordId) {
              return word;
            }
            return {
              ...word,
              examples: word.examples.map((example) =>
                example.id === exampleId ? { ...example, imageUrl: null } : example
              ),
            };
          }),
        };
      });

      setSelectedWord((prevWord) => {
        if (!prevWord || prevWord.id !== wordId) {
          return prevWord;
        }
        return {
          ...prevWord,
          examples: prevWord.examples.map((example) =>
            example.id === exampleId ? { ...example, imageUrl: null } : example
          ),
        };
      });
    } catch (error) {
      console.error('Error deleting example image:', error);
    } finally {
      setImageDeleteState((prev) => {
        const { [exampleId]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Manage Vocabulary
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Edit and organize your vocabulary sets
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Panel - Vocab Sets List */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Sets</h2>
              
              {vocabSets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">No vocabulary sets yet.</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg text-sm"
                  >
                    Create Your First Set
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {vocabSets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => handleSelectSet(set.id)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all ${
                        selectedSet?.id === set.id
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-semibold truncate">{set.name}</div>
                      <div className={`text-xs mt-1 flex items-center justify-between ${
                        selectedSet?.id === set.id ? 'text-purple-100' : 'text-gray-600'
                      }`}>
                        {set.grade && <span>Grade {set.grade}</span>}
                        <span>{set.words?.length || 0} words</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Set Details */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedSet ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Select a Vocabulary Set
                </h3>
                <p className="text-sm text-gray-600">
                  Choose a set from the left to view and edit
                </p>
              </div>
            ) : (
              <>
                {/* Set Info Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5">
                  {editMode === 'set' ? (
                    /* Edit Set Form */
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Set</h2>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Set Name *
                        </label>
                        <input
                          type="text"
                          value={setForm.name}
                          onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                          placeholder="e.g., Week 1 Vocabulary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={setForm.description}
                          onChange={(e) => setSetForm({ ...setForm, description: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm"
                          rows={2}
                          placeholder="Optional description..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Grade Level
                        </label>
                        <input
                          type="text"
                          value={setForm.grade}
                          onChange={(e) => setSetForm({ ...setForm, grade: e.target.value })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                          placeholder="e.g., 5th Grade"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleUpdateSet}
                          className="flex-1 px-5 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors shadow-lg"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="flex-1 px-5 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Set Info */
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-gray-900 truncate">{selectedSet.name}</h2>
                          {selectedSet.description && (
                            <p className="text-sm text-gray-600 mt-1">{selectedSet.description}</p>
                          )}
                          {selectedSet.grade && (
                            <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              Grade {selectedSet.grade}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={handleEditSet}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm({ type: 'set', id: selectedSet.id })}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {selectedSet.words.length} words in this set
                      </div>
                    </div>
                  )}
                </div>

                {/* Words List */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Words</h3>
                  
                  {selectedSet.words.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-500">
                      No words in this set yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSet.words.map((word) => (
                        <div
                          key={word.id}
                          className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
                        >
                          {editMode === 'word' && selectedWord?.id === word.id ? (
                            /* Edit Word Form */
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Word *
                                  </label>
                                  <input
                                    type="text"
                                    value={wordForm.word}
                                    onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Part of Speech
                                  </label>
                                  <input
                                    type="text"
                                    value={wordForm.partOfSpeech}
                                    onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                    placeholder="noun, verb, etc."
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Pronunciation
                                </label>
                                <input
                                  type="text"
                                  value={wordForm.pronunciation}
                                  onChange={(e) => setWordForm({ ...wordForm, pronunciation: e.target.value })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                  placeholder="e.g., FLAW-less-lee"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Definition *
                                </label>
                                <textarea
                                  value={wordForm.definition}
                                  onChange={(e) => setWordForm({ ...wordForm, definition: e.target.value })}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                                  rows={2}
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleUpdateWord}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditMode(null);
                                    setSelectedWord(null);
                                  }}
                                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* View Word */
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <h4 className="text-xl font-bold text-purple-600">
                                      {word.word}
                                    </h4>
                                    {word.partOfSpeech && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                                        {word.partOfSpeech}
                                      </span>
                                    )}
                                  </div>
                                  {word.pronunciation && (
                                    <div className="text-xs text-gray-600 mb-2">
                                      🔊 {word.pronunciation}
                                    </div>
                                  )}
                                  <p className="text-sm text-gray-700">{word.definition}</p>
                                  <div className="mt-3 space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                      Examples ({word.examples.length})
                                    </div>
                                    {word.examples.length === 0 ? (
                                      <p className="text-xs text-gray-500">No examples for this word yet.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {word.examples.map((example) => (
                                          <div
                                            key={example.id}
                                            className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3"
                                          >
                                            <p className="text-sm text-gray-700">{example.sentence}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                              <span
                                                className={`px-2 py-1 rounded-full font-semibold ${
                                                  example.imageUrl
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}
                                              >
                                                {example.imageUrl ? 'Image stored' : 'No image generated'}
                                              </span>
                                              {example.imageUrl ? (
                                                <>
                                                  <a
                                                    href={example.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 transition-colors"
                                                  >
                                                    View
                                                  </a>
                                                  <button
                                                    onClick={() => handleDeleteExampleImage(word.id, example.id)}
                                                    disabled={Boolean(imageDeleteState[example.id])}
                                                    className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                                                      imageDeleteState[example.id]
                                                        ? 'bg-red-200 text-red-500 cursor-not-allowed'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                                  >
                                                    {imageDeleteState[example.id] ? 'Deleting…' : 'Delete Image'}
                                                  </button>
                                                </>
                                              ) : null}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4 flex-shrink-0">
                                  <button
                                    onClick={() => handleEditWord(word)}
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ type: 'word', id: word.id })}
                                    className="px-3 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/30 to-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
            role="presentation"
          />
          <div className="relative z-10 bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Are you sure?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {showDeleteConfirm.type === 'set'
                  ? 'This will delete the entire vocabulary set and all its words. This cannot be undone!'
                  : 'This will delete this word and all its examples. This cannot be undone!'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'set') {
                      handleDeleteSet(showDeleteConfirm.id);
                    } else {
                      handleDeleteWord(showDeleteConfirm.id);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
