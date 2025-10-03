export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-4">
            🎓 Vocab AI
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 mb-2">
            AI-Powered Vocabulary Learning for Elementary Students
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            Powered by Google Gemini & Vercel AI SDK
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto mb-8 md:mb-12">
          {/* Create Vocabulary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:scale-105 active:scale-100">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">📝</div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Create Vocabulary
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Add words and let AI generate definitions, examples, and illustrations.
            </p>
            <a
              href="/create"
              className="inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg active:shadow-md text-sm md:text-base"
            >
              Get Started
            </a>
          </div>

          {/* Study Flashcards */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:scale-105 active:scale-100">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">🎴</div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Study Flashcards
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Review vocabulary with interactive flashcards and track your progress.
            </p>
            <a
              href="/study"
              className="inline-block w-full text-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg active:shadow-md text-sm md:text-base"
            >
              Study Now
            </a>
          </div>

          {/* Manage Sets */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-8 hover:shadow-xl transition-all hover:scale-105 active:scale-100 sm:col-span-2 lg:col-span-1">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4">⚙️</div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 md:mb-4">
              Manage Sets
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Edit and organize your vocabulary sets and words.
            </p>
            <a
              href="/manage"
              className="inline-block w-full text-center bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg active:shadow-md text-sm md:text-base"
            >
              Manage Now
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-6 md:p-8 max-w-5xl mx-auto mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            Features
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
            <div className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-purple-50 transition-colors">
              <div className="text-2xl md:text-3xl flex-shrink-0">🤖</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2">AI-Generated Content</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Automatic definitions, examples, and custom illustrations for each word
                </p>
              </div>
            </div>
            <div className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-purple-50 transition-colors">
              <div className="text-2xl md:text-3xl flex-shrink-0">📊</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2">Progress Tracking</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  Monitor mastery levels and identify words that need more practice
                </p>
              </div>
            </div>
            <div className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-purple-50 transition-colors">
              <div className="text-2xl md:text-3xl flex-shrink-0">🎯</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2">Visual Learning</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  On-demand image generation helps visualize word meanings
                </p>
              </div>
            </div>
            <div className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="text-2xl md:text-3xl flex-shrink-0">⭐</div>
              <div>
                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2">Mastery Levels</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  6-level system from "Not Learned" to "Expert"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="max-w-5xl mx-auto bg-amber-50 border-2 border-amber-200 rounded-2xl md:rounded-3xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-amber-900 mb-3 md:mb-4">
            ⚙️ Setup Required
          </h2>
          <p className="text-sm md:text-base text-amber-800 mb-3 md:mb-4">
            Before you can start using Vocab AI, please complete the following steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-amber-900">
            <li>Add your Google Gemini API key to <code className="bg-amber-100 px-2 py-1 rounded text-xs md:text-sm">.env.local</code></li>
            <li>Set up PostgreSQL database (Docker or local)</li>
            <li>Run <code className="bg-amber-100 px-2 py-1 rounded text-xs md:text-sm">npx prisma migrate dev</code></li>
            <li>Start the development server</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
