'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  group: 'student' | 'parent';
}

export default function Navigation() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    // Student Section
    { 
      href: '/study', 
      label: 'Study', 
      icon: '📚',
      description: 'Review flashcards',
      group: 'student'
    },
    { 
      href: '/games', 
      label: 'Games', 
      icon: '🎮',
      description: 'Practice with games',
      group: 'student'
    },
    // Parent Section
    { 
      href: '/create', 
      label: 'Create', 
      icon: '✨',
      description: 'Build vocab sets',
      group: 'parent'
    },
    { 
      href: '/manage', 
      label: 'Manage', 
      icon: '⚙️',
      description: 'Edit words & sets',
      group: 'parent'
    },
    { 
      href: '/parent', 
      label: 'Progress', 
      icon: '📊',
      description: 'View analytics',
      group: 'parent'
    },
  ];

  const studentItems = navItems.filter(item => item.group === 'student');
  const parentItems = navItems.filter(item => item.group === 'parent');

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🎓</span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900">
                Vocab AI
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {/* Student Section */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400 mr-2 hidden lg:block">
                Student
              </span>
              {studentItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                    title={item.description}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`text-base ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                        {item.icon}
                      </span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-300 hidden md:block"></div>

            {/* Parent Section */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400 mr-2 hidden lg:block">
                Parent
              </span>
              {parentItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                    title={item.description}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`text-base ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                        {item.icon}
                      </span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
