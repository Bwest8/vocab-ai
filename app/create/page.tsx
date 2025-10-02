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

  const exampleText = `1. Aspiring adj. Hoping to be or become something

2. Rival
adj. Competing

3. Siege
n. A situation in which soldiers or police officers surround a city or building to try to take control of it

4. Transform
v. To change something completely, usually in a positive way

5. Loyal
adj. Showing complete faithfulness and support 

6. Seize
v. To take 

7. Esteemed
adj. Highly regarded; admired

8. Privileged
adj. Having more advantages, opportunities, or rights than most people 

9. Enclose
v. To surround; close in

10. Infamous
adj. Well-known for being bad

11. Influential
adj. Having power to change or affect important things or people

12. Armor
n. A protective metal covering used to keep a person safe from injury during battle`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/vocab/process-batch', {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Vocabulary Set
            </h1>
            <p className="text-gray-600">
              Paste your vocabulary words below and let AI process them into a complete learning set.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vocab Set Name */}
            <div>
              <label htmlFor="vocabSetName" className="block text-sm font-medium text-gray-700 mb-2">
                Lesson/Set Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="vocabSetName"
                value={vocabSetName}
                onChange={(e) => setVocabSetName(e.target.value)}
                placeholder="e.g., Lesson 4, Week 1"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Grade */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <input
                type="text"
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g., 5th Grade"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this vocabulary set"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Raw Text Input */}
            <div>
              <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                Vocabulary Words <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Paste your vocabulary list here. Format: numbered list with optional part of speech and definition.
              </p>
              <textarea
                id="rawText"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="1. Word adj. Definition here&#10;2. Another word&#10;3. Third word v. Another definition"
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
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
                  'Process Vocabulary'
                )}
              </button>

              <button
                type="button"
                onClick={loadExample}
                disabled={isProcessing}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Load Example
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">✓ Success!</h3>
              <p className="mb-2">
                Processed <strong>{result.processedWords}</strong> out of <strong>{result.totalWords}</strong> words.
              </p>
              <p className="text-sm">
                Vocab Set ID: <code className="bg-green-100 px-2 py-1 rounded">{result.vocabSet.id}</code>
              </p>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <p className="font-semibold text-yellow-800 mb-1">Some words had errors:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx}>{err.word}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.words && result.words.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Processed Words:</p>
                  <div className="max-h-64 overflow-y-auto bg-white rounded p-3 border border-green-200">
                    {result.words.map((word: any, idx: number) => (
                      <div key={idx} className="mb-3 pb-3 border-b last:border-b-0">
                        <p className="font-semibold text-gray-900">{word.word}</p>
                        <p className="text-sm text-gray-600">{word.definition}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {word.examples?.length || 0} examples created
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions Card */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📝 How to Use</h2>
          <ol className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>Enter a name for your vocabulary set (e.g., "Lesson 4" or "Week 1")</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>Optionally add grade level and description</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <span>Paste your vocabulary words in the text area (or click "Load Example" to see the format)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">4.</span>
              <span>Click "Process Vocabulary" and wait for AI to process each word</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">5.</span>
              <span>Each word will get a definition, pronunciation, part of speech, and 5 example sentences with image descriptions</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
