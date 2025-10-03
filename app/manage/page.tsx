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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            📝 Manage Vocabulary
          </h1>
          <p className="text-lg text-gray-600">
            Edit, update, or delete your vocabulary sets and words
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Vocab Sets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📚 Your Sets
              </h2>
              
              {vocabSets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No vocabulary sets yet.</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="mt-4 px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
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
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        selectedSet?.id === set.id
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{set.name}</div>
                      {set.grade && (
                        <div className="text-sm text-gray-600 mt-1">Grade {set.grade}</div>
                      )}
                      <div className="text-sm text-purple-600 mt-1">
                        {set.words?.length || 0} words
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Set Details & Word Management */}
          <div className="lg:col-span-2">
            {!selectedSet ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Select a Vocabulary Set
                </h3>
                <p className="text-gray-600">
                  Choose a set from the left to view and edit its words
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Set Info Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  {editMode === 'set' ? (
                    // Edit Set Form
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">✏️ Edit Set Info</h2>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Set Name *
                        </label>
                        <input
                          type="text"
                          value={setForm.name}
                          onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
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
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                          rows={3}
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
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                          placeholder="e.g., 4, 5, 6"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleUpdateSet}
                          className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                        >
                          💾 Save Changes
                        </button>
                        <button
                          onClick={() => setEditMode(null)}
                          className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Set Info
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-800">{selectedSet.name}</h2>
                          {selectedSet.description && (
                            <p className="text-gray-600 mt-2">{selectedSet.description}</p>
                          )}
                          {selectedSet.grade && (
                            <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                              Grade {selectedSet.grade}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleEditSet}
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm({ type: 'set', id: selectedSet.id })}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedSet.words.length} words in this set
                      </div>
                    </div>
                  )}
                </div>

                {/* Words List */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">📖 Words</h3>
                  
                  {selectedSet.words.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
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
                            // Edit Word Form
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Word *
                                  </label>
                                  <input
                                    type="text"
                                    value={wordForm.word}
                                    onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Part of Speech
                                  </label>
                                  <input
                                    type="text"
                                    value={wordForm.partOfSpeech}
                                    onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    placeholder="noun, verb, etc."
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Pronunciation
                                </label>
                                <input
                                  type="text"
                                  value={wordForm.pronunciation}
                                  onChange={(e) => setWordForm({ ...wordForm, pronunciation: e.target.value })}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                  placeholder="e.g., FLAW-less-lee"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Definition *
                                </label>
                                <textarea
                                  value={wordForm.definition}
                                  onChange={(e) => setWordForm({ ...wordForm, definition: e.target.value })}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={handleUpdateWord}
                                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditMode(null);
                                    setSelectedWord(null);
                                  }}
                                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Word
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-2xl font-bold text-purple-600">
                                      {word.word}
                                    </h4>
                                    {word.partOfSpeech && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                                        {word.partOfSpeech}
                                      </span>
                                    )}
                                  </div>
                                  {word.pronunciation && (
                                    <div className="text-sm text-gray-600 mb-2">
                                      🔊 {word.pronunciation}
                                    </div>
                                  )}
                                  <p className="text-gray-700">{word.definition}</p>
                                  <div className="text-sm text-gray-500 mt-2">
                                    {word.examples.length} examples
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => handleEditWord(word)}
                                    className="px-3 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ type: 'word', id: word.id })}
                                    className="px-3 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                                  >
                                    🗑️
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-6xl mb-4 text-center">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Are you sure?
            </h3>
            <p className="text-gray-600 text-center mb-6">
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
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
