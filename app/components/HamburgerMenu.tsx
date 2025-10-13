"use client";

import { motion } from "framer-motion";
import Navigation from "./Navigation";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface HamburgerMenuProps {
  className?: string;
  buttonClassName?: string;
}

export default function HamburgerMenu({ className = "", buttonClassName = "" }: HamburgerMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          type="button"
          aria-label="Open navigation menu"
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-indigo-700 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-200/60 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${className} ${buttonClassName}`}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="z-40 bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-800 text-white">
        <SheetHeader className="px-6 pt-10 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Vocab AI
          </div>
          <SheetTitle className="text-white text-2xl font-bold tracking-tight">Adventure Menu</SheetTitle>
          <SheetDescription className="text-indigo-100/90">Pick where you and your learner explore next.</SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-10 max-h-[calc(100dvh-160px)] overflow-y-auto">
          <Navigation closeOnNavigate />
        </div>
        <div className="px-6 pb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <p className="font-semibold text-white">Tip</p>
            <p className="leading-relaxed">Add Vocab AI to your home screen from Safari for an app-like experience.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
