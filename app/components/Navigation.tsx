'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/create', label: 'Create', icon: '📝' },
    { href: '/study', label: 'Study', icon: '🎴' },
    { href: '/manage', label: 'Manage', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform">🎓</span>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Vocab AI
            </span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <span className="text-xl md:text-2xl">{item.icon}</span>
                  <span className="hidden sm:inline text-sm md:text-base">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
