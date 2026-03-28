// Server component wrapper for the game mode page
import { Suspense } from "react";
import GameModeContent from "./GameModeContent";

// Generate static params for all game modes at build time
export function generateStaticParams() {
  return [
    { mode: "definition-match" },
    { mode: "reverse-definition" },
    { mode: "fill-in-the-blank" },
    { mode: "speed-round" },
    { mode: "matching" },
    { mode: "word-scramble" },
  ];
}

export default function GameModePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-lg text-slate-600">Loading game...</div>
        </div>
      }
    >
      <GameModeContent />
    </Suspense>
  );
}
