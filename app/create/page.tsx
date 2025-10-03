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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Create Vocabulary Set
          </h1>
          <p className="text-lg text-slate-600">
            Build a complete learning experience from your word list
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Set Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="vocabSetName" className="block text-sm font-semibold text-slate-700 mb-2">
                  Set Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="vocabSetName"
                  value={vocabSetName}
                  onChange={(e) => setVocabSetName(e.target.value)}
                  placeholder="e.g., Lesson 4, Week 1, Chapter 3"
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-semibold text-slate-700 mb-2">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., 5th Grade"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 pt-6">
              <label htmlFor="rawText" className="block text-sm font-semibold text-slate-700 mb-2">
                Vocabulary Words <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-3">
                Paste your word list in any format. The AI will automatically parse and process each word.
              </p>
              <textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Aspiring, adj&#10;Rival, adj&#10;Siege, n&#10;Transform, v"
                required
                rows={12}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-slate-900 placeholder-slate-400 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
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
                className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Load Example
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 text-sm">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">Success!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Created vocabulary set with <strong>{result.processedWords}</strong> words.
                </p>
              </div>
            </div>

            {result.vocabSet && (
              <div className="bg-white rounded-md p-4 border border-green-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 font-medium">Set Name</p>
                    <p className="text-slate-900 font-semibold">{result.vocabSet.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Total Words</p>
                    <p className="text-slate-900 font-semibold">{result.vocabSet.words?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-bold text-blue-900 text-lg mb-4">How It Works</h2>
          <ol className="space-y-3 text-sm text-blue-900">
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
