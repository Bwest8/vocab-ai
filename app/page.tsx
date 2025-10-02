export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎓 Vocab AI
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI-Powered Vocabulary Learning for Elementary Students
          </p>
          <p className="text-sm text-gray-500">
            Powered by Google Gemini & Vercel AI SDK
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Create Vocabulary */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create Vocabulary
            </h2>
            <p className="text-gray-600 mb-6">
              Add words and let AI generate definitions, examples, and illustrations.
            </p>
            <a
              href="/create"
              className="inline-block w-full text-center bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Study Flashcards */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎴</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Study Flashcards
            </h2>
            <p className="text-gray-600 mb-6">
              Review vocabulary with interactive flashcards and track your progress.
            </p>
            <a
              href="/study"
              className="inline-block w-full text-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Study Now
            </a>
          </div>

          {/* Play Games */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Play Games
            </h2>
            <p className="text-gray-600 mb-6">
              Reinforce learning with fun matching games and quizzes.
            </p>
            <a
              href="/games"
              className="inline-block w-full text-center bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Play Games
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-2xl">🤖</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">AI-Generated Content</h3>
                <p className="text-gray-600 text-sm">
                  Automatic definitions, examples, and custom illustrations for each word
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Monitor mastery levels and identify words that need more practice
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Interactive Games</h3>
                <p className="text-gray-600 text-sm">
                  Matching games and quizzes make learning fun and engaging
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-2xl">⭐</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Mastery Levels</h3>
                <p className="text-gray-600 text-sm">
                  6-level system from "Not Learned" to "Expert"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-12 max-w-4xl mx-auto bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            ⚙️ Setup Required
          </h2>
          <p className="text-amber-800 mb-4">
            Before you can start using Vocab AI, please complete the following steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-amber-900">
            <li>Add your Google Gemini API key to <code className="bg-amber-100 px-2 py-1 rounded">.env.local</code></li>
            <li>Set up PostgreSQL database (Docker or local)</li>
            <li>Run <code className="bg-amber-100 px-2 py-1 rounded">npx prisma migrate dev</code></li>
            <li>Start the development server</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
