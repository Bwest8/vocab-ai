"use client";

interface AnswerButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled?: boolean;
  variant?: "default" | "large";
  className?: string;
}

export function AnswerButton({
  children,
  onClick,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  disabled = false,
  variant = "default",
  className = "",
}: AnswerButtonProps) {
  const baseClasses = "rounded-2xl border-2 font-bold transition-all duration-200 text-left";

  const sizeClasses = variant === "large"
    ? "px-8 py-6 text-xl min-h-[80px]"
    : "px-6 py-4 text-lg min-h-[60px]";

  let stateClasses = "";

  if (disabled && !isSelected && !isCorrect && !isWrong) {
    stateClasses = "opacity-40 cursor-not-allowed";
  } else if (isCorrect) {
    stateClasses = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-lg scale-105";
  } else if (isWrong) {
    stateClasses = "border-rose-500 bg-rose-50 text-rose-900 shadow-lg";
  } else if (isSelected) {
    stateClasses = "border-blue-400 bg-blue-50 text-blue-900";
  } else {
    stateClasses = "border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50 active:scale-95 shadow-sm";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${stateClasses} ${className}`}
    >
      {children}
    </button>
  );
}
