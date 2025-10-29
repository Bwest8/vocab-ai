"use client";

interface FeedbackMessageProps {
  isCorrect: boolean;
  message: string;
  word?: string;
  definition?: string;
  showContext?: boolean;
}

const encouragingMessages = {
  correct: [
    "Excellent work!",
    "You've got it!",
    "Perfect!",
    "Amazing!",
    "Well done!",
    "Outstanding!",
    "Brilliant!",
    "Fantastic!",
  ],
  incorrect: [
    "Not quite, but keep trying!",
    "Good effort! Let's learn from this.",
    "Almost there! Keep going!",
    "Don't worry, you'll get the next one!",
  ],
};

export function FeedbackMessage({
  isCorrect,
  message,
  word,
  definition,
  showContext = true,
}: FeedbackMessageProps) {
  const randomEncouragement = isCorrect
    ? encouragingMessages.correct[Math.floor(Math.random() * encouragingMessages.correct.length)]
    : encouragingMessages.incorrect[Math.floor(Math.random() * encouragingMessages.incorrect.length)];

  return (
    <div
      className={`rounded-2xl border-2 p-6 shadow-lg transition-all landscape:p-4 ${
        isCorrect
          ? "border-emerald-400 bg-emerald-50"
          : "border-rose-400 bg-rose-50"
      }`}
    >
      <div className="flex items-start gap-4 landscape:gap-3">
        <div className="text-4xl landscape:text-3xl">{isCorrect ? "✅" : "💡"}</div>
        <div className="flex-1 space-y-3 landscape:space-y-2">
          <p
            className={`text-lg font-bold landscape:text-base ${
              isCorrect ? "text-emerald-900" : "text-rose-900"
            }`}
          >
            {randomEncouragement}
          </p>
          {!isCorrect && (
            <p
              className={`text-base font-semibold landscape:text-sm ${
                isCorrect ? "text-emerald-800" : "text-rose-800"
              }`}
            >
              {message}
            </p>
          )}
          {showContext && word && definition && (
            <div className="mt-4 rounded-xl bg-white/60 p-4 backdrop-blur-sm landscape:mt-3 landscape:p-3">
              <p className="text-sm font-bold text-slate-600 uppercase tracking-wide landscape:text-xs">
                Remember
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 landscape:mt-1 landscape:text-base">{word}</p>
              <p className="mt-1 text-base text-slate-700 landscape:text-sm">{definition}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
