'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';

interface VocabSetSummary {
  id: string;
  name: string;
}

interface CreateVocabResult {
  processedWords: number;
  vocabSet?: {
    name: string;
    words?: Array<{ id: string }>;
  };
  provider?: 'xai' | 'gemini';
  error?: string;
}

type Provider = 'xai' | 'gemini';

export default function CreateVocabPage() {
  const [vocabSetName, setVocabSetName] = useState('');
  const [grade, setGrade] = useState('04');
  const [description, setDescription] = useState('');
  const [rawText, setRawText] = useState('');
  const [provider, setProvider] = useState<Provider>('xai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CreateVocabResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNextLesson = async () => {
      try {
        const response = await fetch('/api/vocab');
        if (!response.ok) throw new Error('Failed to fetch vocab sets');
        const sets: VocabSetSummary[] = await response.json();
        const lessonNumbers = sets
          .map((set) => set.name)
          .filter((name: string) => name.startsWith('Lesson '))
          .map((name: string) => parseInt(name.replace('Lesson ', '')))
          .filter((num: number) => !isNaN(num));
        const maxNum = lessonNumbers.length > 0 ? Math.max(...lessonNumbers) : 0;
        const nextNum = maxNum + 1;
        setVocabSetName(`Lesson ${nextNum}`);
      } catch (error) {
        console.error('Failed to fetch next lesson number:', error);
        setVocabSetName('Lesson 1');
      }
    };
    fetchNextLesson();
  }, []);

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
          provider,
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

  return (
    <>
      <Header
        title="Create Vocabulary Set"
        showVocabSetSelector={false}
      />

      <div className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-slate-100 to-white pb-24 pt-6 md:pt-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8 px-4 sm:px-6 lg:px-8">

        {/* Main Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                AI Provider
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('xai')}
                  className={`flex-1 px-4 py-3 rounded-xl border transition-all font-semibold ${
                    provider === 'xai'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">XAI (Grok)</div>
                    <div className="text-xs opacity-90">Current</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('gemini')}
                  className={`flex-1 px-4 py-3 rounded-xl border transition-all font-semibold ${
                    provider === 'gemini'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">Gemini</div>
                    <div className="text-xs opacity-90">Testing</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Set Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="vocabSetName" className="block text-sm font-bold text-slate-700 mb-2">
                  Set Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="vocabSetName"
                  value={vocabSetName}
                  onChange={(e) => setVocabSetName(e.target.value)}
                  placeholder="e.g., Lesson 4, Week 1, Chapter 3"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-slate-900 placeholder-slate-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grade" className="block text-sm font-bold text-slate-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-slate-900 bg-white transition-all"
                  >
                    <option value="04">4th Grade</option>
                    <option value="05">5th Grade</option>
                    <option value="06">6th Grade</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none text-slate-900 placeholder-slate-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 pt-5">
              <label htmlFor="rawText" className="block text-sm font-bold text-slate-700 mb-2">
                Vocabulary Words <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Paste your word list in any format. The AI will automatically parse and process each word.
              </p>
              <textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Aspiring, adj&#10;Rival, adj&#10;Siege, n&#10;Transform, v"
                required
                rows={12}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none font-mono text-sm text-slate-900 placeholder-slate-400 resize-none transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Processing with {provider.toUpperCase()}...
                  </span>
                ) : (
                  <span>✨ Create Set with {provider.toUpperCase()}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-bold text-rose-900 text-base">Error</h3>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-md">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">✓</span>
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 text-xl">Success!</h3>
                <p className="text-base text-emerald-700 mt-1">
                  Created vocabulary set with <strong>{result.processedWords}</strong> words using <strong>{result.provider?.toUpperCase()}</strong>.
                </p>
              </div>
            </div>

            {result.vocabSet && (
              <div className="bg-white rounded-xl p-5 border border-emerald-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 font-semibold">Set Name</p>
                    <p className="text-slate-900 font-bold text-base">{result.vocabSet.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold">Total Words</p>
                    <p className="text-slate-900 font-bold text-base">{result.vocabSet.words?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-md">
          <h2 className="font-bold text-indigo-900 text-xl mb-4">How It Works</h2>
          <ol className="space-y-3 text-sm text-indigo-900">
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>Choose your AI provider (XAI is current, Gemini is for testing)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>Enter a name for your vocabulary set</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>Paste your word list in any format (numbered, comma-separated, etc.)</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>Click "Create Set" and the AI will process each word</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">5.</span>
              <span>Each word receives a definition, pronunciation, and 5 example sentences</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">6.</span>
              <span>Students can generate visual illustrations on-demand while studying</span>
            </li>
          </ol>
        </div>
        </div>
      </div>
    </>
  );
}
