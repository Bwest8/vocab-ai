// Flat ESLint config for Next.js 16 + ESLint 9
// Docs: https://nextjs.org/docs/app/building-your-application/configuring/eslint
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  // Base Next.js rules with Core Web Vitals
  ...nextVitals,
  // TypeScript rules recommended by Next.js
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'prefer-const': 'warn',
    },
  },
  // Allow require() usage in Node config files
  {
    files: ['next.config.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Ignore generated/build output
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/**',
  ]),
]);
