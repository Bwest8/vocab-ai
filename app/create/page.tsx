'use client';

import { useState } from 'react';

export default function CreateVocabPage() {
  const [vocabSetName, setVocabSetName] = useState('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleText = `Aspiring, adj
Rival, adj
Siege, n
Transform, v
Loyal, adj
Seize, v
Esteemed, adj
Privileged, adj
Enclose, v
Infamous, adj
Influential, adj
Armor, n`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/vocab/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawText,
          vocabSetName,
          description,
          grade,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process vocabulary');
      }

      setResult(data);
      
      // Clear form on success
      setRawText('');
      setVocabSetName('');
      setDescription('');
      setGrade('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadExample = () => {
    setRawText(exampleText);
    setVocabSetName('Lesson 4');
    setGrade('5th Grade');
    setDescription('Vocabulary words from Lesson 4');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Create Vocabulary Set
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Build a complete learning experience from your word list
          </p>
        </header>

        {/* Main Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Set Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="vocabSetName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Set Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="vocabSetName"
                  value={vocabSetName}
                  onChange={(e) => setVocabSetName(e.target.value)}
                  placeholder="e.g., Lesson 4, Week 1, Chapter 3"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., 5th Grade"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-5">
              <label htmlFor="rawText" className="block text-sm font-semibold text-gray-700 mb-2">
                Vocabulary Words <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Paste your word list in any format. The AI will automatically parse and process each word.
              </p>
              <textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Aspiring, adj&#10;Rival, adj&#10;Siege, n&#10;Transform, v"
                required
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm text-gray-900 placeholder-gray-400 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Create Set'
                )}
              </button>

              <button
                type="button"
                onClick={loadExample}
                disabled={isProcessing}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Load Example
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 text-sm">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">✓</span>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">Success!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Created vocabulary set with <strong>{result.processedWords}</strong> words.
                </p>
              </div>
            </div>

            {result.vocabSet && (
              <div className="bg-white rounded-xl p-4 border-2 border-green-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Set Name</p>
                    <p className="text-gray-900 font-semibold">{result.vocabSet.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Total Words</p>
                    <p className="text-gray-900 font-semibold">{result.vocabSet.words?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
          <h2 className="font-bold text-indigo-900 text-lg mb-4">How It Works</h2>
          <ol className="space-y-3 text-sm text-indigo-900">
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Enter a name for your vocabulary set</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Paste your word list in any format (numbered, comma-separated, etc.)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>Click "Create Set" and the AI will process each word</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>Each word receives a definition, pronunciation, and 5 example sentences</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">5.</span>
              <span>Students can generate visual illustrations on-demand while studying</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
