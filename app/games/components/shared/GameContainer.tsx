"use client";

import { ReactNode } from "react";

interface GameContainerProps {
  children: ReactNode;
  className?: string;
}

export function GameContainer({ children, className = "" }: GameContainerProps) {
  return (
    <div className={`mx-auto h-full w-full max-w-7xl px-4 py-4 landscape:flex landscape:flex-col landscape:px-8 landscape:py-6 ${className}`}>
      {children}
    </div>
  );
}
