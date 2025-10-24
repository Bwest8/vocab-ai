'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  group: 'student' | 'parent';
}

const navItems: NavItem[] = [
  {
    href: '/study',
    label: 'Study',
    icon: '📚',
    description: 'Review flashcards and lessons',
    group: 'student',
  },
  {
    href: '/games',
    label: 'Games',
    icon: '🎮',
    description: 'Practice vocabulary with mini-games',
    group: 'student',
  },
  {
    href: '/create',
    label: 'Create',
    icon: '✨',
    description: 'Build new vocabulary sets',
    group: 'parent',
  },
  {
    href: '/manage',
    label: 'Manage',
    icon: '⚙️',
    description: 'Edit words and assignments',
    group: 'parent',
  },
  {
    href: '/parent',
    label: 'Progress',
    icon: '📊',
    description: 'See study reports and analytics',
    group: 'parent',
  },
];

const navGroups = [
  {
    title: 'Learner Hub',
    accent: 'from-indigo-500 to-sky-500',
    items: navItems.filter((item) => item.group === 'student'),
  },
  {
    title: 'Grown-Up Tools',
    accent: 'from-emerald-500 to-teal-500',
    items: navItems.filter((item) => item.group === 'parent'),
  },
];

interface NavigationProps {
  onNavigate?: () => void;
  closeOnNavigate?: boolean;
}

export default function Navigation({ onNavigate, closeOnNavigate = false }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-8">
      {navGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${group.accent} text-xs font-bold text-white shadow-sm`}>★</span>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/95 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
              {group.title}
            </span>
          </div>
          <div className="grid gap-2">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (closeOnNavigate) {
                        // Try closing any open radix sheet/dialog by clicking close button if present
                        const btn = document.querySelector('[data-slot="sheet-close"], [data-radix-dialog-close]') as HTMLButtonElement | null;
                        btn?.click();
                      }
                      onNavigate?.();
                    }}
                    className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-white/20 bg-white/10 text-white shadow-[0_8px_30px_rgb(76,106,255,0.25)]'
                        : 'border-white/10 bg-white/5 text-white/95 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold tracking-tight text-white">{item.label}</span>
                      <span className="text-xs text-white/85 leading-tight">{item.description}</span>
                    </div>
                    {isActive && (
                      <motion.span
                        layoutId="active-pill"
                        className="ml-auto inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
