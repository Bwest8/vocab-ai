"use client";

interface GameIntroProps {
  icon: string;
  title: string;
  description: string;
  objective: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  questionsCount: number;
  onStart: () => void;
  color: "indigo" | "purple" | "emerald" | "amber" | "pink" | "blue";
}

const colorClasses = {
  indigo: {
    gradient: "from-indigo-500 to-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  purple: {
    gradient: "from-purple-500 to-purple-600",
    button: "bg-purple-600 hover:bg-purple-700 text-white",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  amber: {
    gradient: "from-amber-500 to-amber-600",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
  },
  pink: {
    gradient: "from-pink-500 to-pink-600",
    button: "bg-pink-600 hover:bg-pink-700 text-white",
    badge: "bg-pink-100 text-pink-800 border-pink-300",
  },
  blue: {
    gradient: "from-blue-500 to-blue-600",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
};

export function GameIntro({
  icon,
  title,
  description,
  objective,
  difficulty = "Medium",
  questionsCount,
  onStart,
  color,
}: GameIntroProps) {
  const colors = colorClasses[color];

  return (
    <div className="rounded-3xl border border-white/80 bg-white/95 p-8 shadow-2xl backdrop-blur-sm md:p-12">
      {/* Header */}
      <div className={`mb-8 rounded-2xl bg-gradient-to-r ${colors.gradient} p-8 text-center shadow-lg`}>
        <div className="mb-4 text-6xl">{icon}</div>
        <h1 className="text-4xl font-extrabold text-white">{title}</h1>
      </div>

      {/* Game Info */}
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            About This Game
          </h2>
          <p className="text-xl leading-relaxed text-slate-700">{description}</p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Learning Objective
          </h2>
          <p className="text-xl leading-relaxed text-slate-700">{objective}</p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className={`rounded-xl border-2 px-4 py-2 ${colors.badge}`}>
            <span className="font-bold">{questionsCount}</span> Questions
          </div>
          <div className={`rounded-xl border-2 px-4 py-2 ${colors.badge}`}>
            <span className="font-bold">{difficulty}</span> Difficulty
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={onStart}
          className={`mt-8 w-full rounded-2xl py-6 text-2xl font-bold shadow-lg transition-all active:scale-95 ${colors.button}`}
        >
          Start Game! 🚀
        </button>
      </div>
    </div>
  );
}
