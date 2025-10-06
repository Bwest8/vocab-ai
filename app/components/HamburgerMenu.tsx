"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "./Navigation";

interface HamburgerMenuProps {
  className?: string;
  buttonClassName?: string;
}

export default function HamburgerMenu({ className = "", buttonClassName = "" }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  return (
    <div className={`relative z-[100] ${className}`}>
      <motion.button
        type="button"
        onClick={toggleMenu}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="primary-navigation"
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-indigo-700 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-200/60 backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${buttonClassName}`}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
      >
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        <AnimatePresence initial={false} mode="wait">
          <motion.svg
            key={isOpen ? "close" : "open"}
            initial={{ rotate: -15, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 15, opacity: 0 }}
            transition={{ duration: 0.18 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            {isOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </motion.svg>
        </AnimatePresence>
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenu}
              />
              <motion.aside
                id="primary-navigation"
                aria-label="Primary navigation"
                className="fixed inset-y-0 right-0 z-[9999] w-[min(90vw,360px)] bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-800 text-white shadow-2xl"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between px-6 pt-10 pb-6">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                        Vocab AI
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">Adventure Menu</h2>
                      <p className="text-sm text-white/70">Pick where you and your learner explore next.</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={closeMenu}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      whileTap={{ scale: 0.92 }}
                      aria-label="Close navigation"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 pb-10">
                    <Navigation onNavigate={closeMenu} />
                  </div>
                  <div className="px-6 pb-8">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                      <p className="font-semibold text-white">Tip</p>
                      <p className="leading-relaxed">
                        Add Vocab AI to your home screen from Safari for an app-like experience on iPad.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
