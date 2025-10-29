"use client";

import { useRouter } from "next/navigation";

interface GameHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  currentQuestion?: number;
  totalQuestions?: number;
  color: "indigo" | "purple" | "emerald" | "amber" | "pink" | "blue";
  showProgress?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

const colorClasses = {
  indigo: {
    bg: "bg-indigo-500",
    gradient: "from-indigo-500 to-indigo-600",
    text: "text-indigo-50",
    subtext: "text-indigo-100",
    progressBg: "bg-indigo-400",
    progressFill: "bg-white",
    dot: "bg-white",
    dotInactive: "bg-indigo-300",
  },
  purple: {
    bg: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
    text: "text-purple-50",
    subtext: "text-purple-100",
    progressBg: "bg-purple-400",
    progressFill: "bg-white",
    dot: "bg-white",
    dotInactive: "bg-purple-300",
  },
  emerald: {
    bg: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
    text: "text-emerald-50",
    subtext: "text-emerald-100",
    progressBg: "bg-emerald-400",
    progressFill: "bg-white",
    dot: "bg-white",
    dotInactive: "bg-emerald-300",
  },
  amber: {
    bg: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
    text: "text-amber-50",
    subtext: "text-amber-100",
    progressBg: "bg-amber-400",
    progressFill: "bg-white",
    dot: "bg-white",
    dotInactive: "bg-amber-300",
  },
  pink: {
    bg: "bg-pink-500",
    gradient: "from-pink-500 to-pink-600",
    text: "text-pink-50",
    subtext: "text-pink-100",
    progressBg: "bg-pink-400",
    progressFill: "bg-white",
    dot: "bg-white",
    dotInactive: "bg-pink-300",
  },
  blue: {
    bg: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    text: "text-blue-50",
    subtext: "text-blue-100",
    progressBg: "bg-blue-400",
    progressFill: "bg-white",
    dot: "bg-white",
    dotInactive: "bg-blue-300",
  },
};

export function GameHeader({
  icon,
  title,
  subtitle,
  currentQuestion,
  totalQuestions,
  color,
  showProgress = true,
  showBack = true,
  onBack,
}: GameHeaderProps) {
  const router = useRouter();
  const colors = colorClasses[color];
  const progress = currentQuestion && totalQuestions ? (currentQuestion / totalQuestions) * 100 : 0;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/games");
    }
  };

  return (
    <div className={`bg-gradient-to-r ${colors.gradient} shadow-md`}>
      {/* Ultra-compact: Fixed 48px height in landscape */}
      <div className="flex h-16 items-center justify-between gap-4 px-6 landscape:h-12 landscape:px-8">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center text-2xl ${colors.text}`}>
            {icon}
          </div>
          <h1 className={`text-lg font-bold ${colors.text} landscape:text-base`}>{title}</h1>
        </div>

        {/* Center: Progress Dots */}
        {showProgress && currentQuestion && totalQuestions && (
          <div className="flex flex-1 items-center justify-center gap-2">
            {Array.from({ length: Math.min(totalQuestions, 10) }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx < currentQuestion
                    ? colors.dot
                    : idx === currentQuestion - 1
                    ? `${colors.dot} ring-2 ring-white/40`
                    : colors.dotInactive
                }`}
              />
            ))}
          </div>
        )}

        {/* Right: Question Counter */}
        {currentQuestion && totalQuestions && (
          <div className={`rounded-lg ${colors.text} bg-white/15 px-4 py-1.5 text-sm font-bold backdrop-blur`}>
            {currentQuestion} / {totalQuestions}
          </div>
        )}
      </div>
    </div>
  );
}
