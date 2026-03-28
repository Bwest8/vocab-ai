# Enable Next.js 16 Cache Components for vocab-ai

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Enable and configure Next.js 16 Cache Components to improve vocab-ai performance through fine-grained, declarative caching of vocabulary data, word definitions, and study progress.

**Architecture:** 
- Enable `experimental.cacheComponents` in next.config.ts
- Convert static data fetching (vocab sets, word lists) to use `"use cache"` directives
- Keep dynamic data (user progress, real-time game state) uncached or use short cache lifetimes
- Use `cacheTag()` for selective invalidation when content changes

**Tech Stack:** Next.js 16.2.1, React 19, Prisma, PostgreSQL

---

## Current State Analysis

**What vocab-ai does now:**
- Client-side data fetching with `fetch("/api/vocab", { cache: "no-store" })`
- All data fetched fresh on every page load
- API routes query Prisma directly (no caching layer)
- `/study` page loads vocab sets, then words for selected set — two sequential fetches

**Cache Component opportunities:**
1. **Vocabulary sets list** — Changes rarely (only when admin adds new set)
2. **Word definitions/examples** — Static once created, only change on edit
3. **Generated images** — Expensive to create, should cache indefinitely
4. **User progress** — Changes frequently (every study session), use short cache or no cache

---

## Phase 1: Configuration & Setup

### Task 1: Enable Cache Components in next.config.ts

**Objective:** Add the experimental flag to enable Cache Components mode

**Files:**
- Modify: `next.config.ts`

**Step 1: Add experimental.cacheComponents flag**

```typescript
const baseConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable Cache Components (replaces ISR with fine-grained caching)
  experimental: {
    cacheComponents: true,
  },
  turbopack: {},
};
```

**Step 2: Verify no conflicts**

Check for and remove any incompatible configs:
- `experimental.dynamicIO` (should be renamed to `cacheComponents`)
- `experimental.ppr` (removed in v16)

**Step 3: Commit**

```bash
git add next.config.ts
git commit -m "config: enable experimental.cacheComponents for Next.js 16"
```

---

## Phase 2: Create Cached Data Layer

### Task 2: Create lib/data/cache.ts with cacheLife profiles

**Objective:** Define reusable cache life profiles for vocab-ai data patterns

**Files:**
- Create: `lib/data/cache.ts`

**Step 1: Create cache profiles**

```typescript
// lib/data/cache.ts
import { cacheLife } from 'next/cache';

// Cache profiles for vocab-ai data patterns
export const cacheProfiles = {
  // Vocabulary sets — change rarely, cache for hours
  vocabSets: () => cacheLife('hours'),
  
  // Word definitions — static once created
  wordDefinitions: () => cacheLife('hours'),
  
  // Generated images — expensive, cache for days
  generatedImages: () => cacheLife('days'),
  
  // User progress — changes frequently, short cache
  userProgress: () => cacheLife('minutes'),
  
  // Game state — very dynamic, minimal caching
  gameState: () => cacheLife('seconds'),
} as const;

// Cache tag helpers for invalidation
export const cacheTags = {
  vocabSets: 'vocab-sets',
  vocabSet: (id: string) => `vocab-set-${id}`,
  words: (setId: string) => `words-${setId}`,
  word: (wordId: string) => `word-${wordId}`,
  userProgress: (userId: string) => `progress-${userId}`,
  images: (wordId: string) => `images-${wordId}`,
} as const;
```

**Step 2: Commit**

```bash
git add lib/data/cache.ts
git commit -m "feat(cache): add cacheLife profiles and cacheTag helpers"
```

---

### Task 3: Create cached data fetching functions

**Objective:** Create server-side cached wrappers for Prisma queries

**Files:**
- Create: `lib/data/vocab.ts`

**Step 1: Create cached vocab set functions**

```typescript
// lib/data/vocab.ts
'use server';

import { prisma } from '@/lib/prisma';
import { cacheProfiles, cacheTags } from './cache';
import { cacheTag } from 'next/cache';

// Cached: Get all vocabulary sets (rarely changes)
export async function getVocabSets() {
  'use cache';
  cacheProfiles.vocabSets();
  cacheTag(cacheTags.vocabSets);
  
  return prisma.vocabSet.findMany({
    include: {
      words: {
        select: { id: true, word: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Cached: Get single vocab set with words
export async function getVocabSetWithWords(id: string) {
  'use cache';
  cacheProfiles.vocabSets();
  cacheTag(cacheTags.vocabSet(id));
  cacheTag(cacheTags.words(id));
  
  return prisma.vocabSet.findUnique({
    where: { id },
    include: {
      words: {
        include: {
          examples: true,
          progress: {
            where: { userId: null }, // Global progress for now
          },
        },
      },
    },
  });
}

// Cached: Get word details
export async function getWordDetails(wordId: string) {
  'use cache';
  cacheProfiles.wordDefinitions();
  cacheTag(cacheTags.word(wordId));
  
  return prisma.word.findUnique({
    where: { id: wordId },
    include: {
      examples: true,
      progress: true,
    },
  });
}
```

**Step 2: Commit**

```bash
git add lib/data/vocab.ts
git commit -m "feat(cache): add cached vocab data fetching functions"
```

---

### Task 4: Create cached components for vocabulary data

**Objective:** Create React components that fetch data with caching

**Files:**
- Create: `app/components/VocabSetSelector.tsx`

**Step 1: Create server component with cache**

```typescript
// app/components/VocabSetSelector.tsx
import { getVocabSets } from '@/lib/data/vocab';

export async function VocabSetSelector() {
  // This data is automatically cached per cacheLife profile
  const vocabSets = await getVocabSets();
  
  return (
    <select name="vocabSet" className="...">
      {vocabSets.map((set) => (
        <option key={set.id} value={set.id}>
          {set.name} ({set.words.length} words)
        </option>
      ))}
    </select>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/VocabSetSelector.tsx
git commit -m "feat(components): add VocabSetSelector with cached data"
```

---

## Phase 3: Update Pages to Use Cached Components

### Task 5: Update /study page to use cached data

**Objective:** Convert study page from client-side fetching to server component with caching

**Files:**
- Create: `app/study/StudyPageClient.tsx` (move current page.tsx content here)
- Modify: `app/study/page.tsx` (become server component with cached data)

**Step 1: Rename current page to client component**

```bash
mv app/study/page.tsx app/study/StudyPageClient.tsx
```

Update imports in StudyPageClient.tsx:
- Remove `"use client"` from top
- Add `'use client'` at top
- Change export from `export default function Home()` to `export function StudyPageClient({ vocabSets, words })`

**Step 2: Create new server page with caching**

```typescript
// app/study/page.tsx
import { getVocabSets, getVocabSetWithWords } from '@/lib/data/vocab';
import { StudyPageClient } from './StudyPageClient';

export default async function StudyPage({
  searchParams,
}: {
  searchParams: { set?: string };
}) {
  // Cached: All vocab sets (loaded once, cached for hours)
  const vocabSets = await getVocabSets();
  
  // Determine which set to show
  const selectedSetId = searchParams.set || vocabSets[0]?.id;
  
  // Cached: Words for selected set (cached per set ID)
  const selectedSet = selectedSetId 
    ? await getVocabSetWithWords(selectedSetId)
    : null;
  
  return (
    <StudyPageClient 
      vocabSets={vocabSets} 
      initialSet={selectedSet}
    />
  );
}
```

**Step 3: Update StudyPageClient to receive props**

Modify StudyPageClient.tsx to:
- Accept `vocabSets` and `initialSet` as props
- Remove the `useEffect` that fetches vocab sets
- Use props instead of fetched state

**Step 4: Commit**

```bash
git add app/study/
git commit -m "refactor(study): convert to server component with cached data fetching"
```

---

### Task 6: Update /manage page with partial caching

**Objective:** Keep client-side interactivity while caching static data

**Files:**
- Create: `app/manage/ManagePageClient.tsx`
- Modify: `app/manage/page.tsx`

**Step 1: Create server page with cached vocab sets**

```typescript
// app/manage/page.tsx
import { getVocabSets } from '@/lib/data/vocab';
import { ManagePageClient } from './ManagePageClient';

export default async function ManagePage() {
  // Cached vocab sets for initial render
  const vocabSets = await getVocabSets();
  
  return <ManagePageClient initialVocabSets={vocabSets} />;
}
```

**Step 2: Update ManagePageClient to use initial data**

- Accept `initialVocabSets` prop
- Use as default state, still allow refresh for edits
- Keep client-side mutations for CRUD operations

**Step 3: Commit**

```bash
git add app/manage/
git commit -m "refactor(manage): add server-side caching for vocab sets list"
```

---

## Phase 4: Cache Invalidation Integration

### Task 7: Add cache invalidation to mutation API routes

**Objective:** When data changes, invalidate the relevant cache tags

**Files:**
- Modify: `app/api/vocab/create/route.ts`
- Modify: `app/api/vocab/[id]/route.ts`
- Modify: `app/api/vocab/words/[wordId]/route.ts`

**Step 1: Update create route to invalidate cache**

```typescript
// app/api/vocab/create/route.ts
import { revalidateTag } from 'next/cache';
import { cacheTags } from '@/lib/data/cache';

export async function POST(request: Request) {
  // ... existing create logic ...
  
  // After successful creation:
  await revalidateTag(cacheTags.vocabSets);
  
  return NextResponse.json(newSet);
}
```

**Step 2: Update update/delete routes**

```typescript
// app/api/vocab/[id]/route.ts
import { revalidateTag } from 'next/cache';
import { cacheTags } from '@/lib/data/cache';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // ... update logic ...
  
  // Invalidate specific set and the list
  await revalidateTag(cacheTags.vocabSet(id));
  await revalidateTag(cacheTags.vocabSets);
  
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // ... delete logic ...
  
  await revalidateTag(cacheTags.vocabSet(id));
  await revalidateTag(cacheTags.vocabSets);
  
  return NextResponse.json({ success: true });
}
```

**Step 3: Commit**

```bash
git add app/api/
git commit -m "feat(api): add cache invalidation on vocab mutations"
```

---

## Phase 5: Advanced Patterns

### Task 8: Cache generated images with long lifetime

**Objective:** Cache expensive image generation results

**Files:**
- Modify: `app/api/vocab/[id]/examples/[exampleId]/generate-image/route.ts`
- Create: `lib/data/images.ts`

**Step 1: Create cached image fetcher**

```typescript
// lib/data/images.ts
'use server';

import { prisma } from '@/lib/prisma';
import { cacheProfiles, cacheTags } from './cache';
import { cacheTag } from 'next/cache';

export async function getExampleImage(exampleId: string) {
  'use cache';
  cacheProfiles.generatedImages();
  cacheTag(`example-image-${exampleId}`);
  
  return prisma.example.findUnique({
    where: { id: exampleId },
    select: { imageUrl: true, sentence: true },
  });
}
```

**Step 2: Add invalidation on image generation**

```typescript
// In generate-image route.ts after generation completes:
import { revalidateTag } from 'next/cache';

// Invalidate the cached image
await revalidateTag(`example-image-${exampleId}`);
```

**Step 3: Commit**

```bash
git add lib/data/images.ts app/api/vocab/
git commit -m "feat(images): add long-term caching for generated images"
```

---

## Phase 6: Testing & Verification

### Task 9: Build verification

**Objective:** Ensure the app builds without errors after Cache Components migration

**Step 1: Run build**

```bash
cd /media/brian/Storage/Projects/vocab-ai
bun run build
```

**Expected:** Build completes without errors. May see warnings about experimental features.

**Step 2: Check for common issues**

If build fails:
- Check for `"use client"` in components using cached data
- Ensure `async` components have proper Suspense boundaries
- Verify no `fetch()` calls with `{ cache: "no-store" }` in server components

**Step 3: Commit if build passes**

```bash
git commit -m "chore: verify build passes with Cache Components enabled"
```

---

### Task 10: Runtime verification

**Objective:** Test the app works correctly with caching

**Step 1: Start dev server**

```bash
bun run dev
```

**Step 2: Test study page**
- Load `/study` — should load quickly (cached vocab sets)
- Switch between sets — words should load from cache if previously viewed
- Check browser dev tools — verify no unnecessary API calls

**Step 3: Test mutations**
- Add a new vocab set in `/manage`
- Return to `/study` — new set should appear (cache invalidated)
- Verify cache invalidation worked

**Step 4: Document results**

Note any issues in plan document for fixes.

---

## Summary

### What Changes

| File | Change |
|------|--------|
| `next.config.ts` | Add `experimental.cacheComponents: true` |
| `lib/data/cache.ts` | New — cache profiles and tag helpers |
| `lib/data/vocab.ts` | New — cached data fetching functions |
| `lib/data/images.ts` | New — cached image functions |
| `app/study/page.tsx` | Convert to server component |
| `app/study/StudyPageClient.tsx` | Refactored — receive props |
| `app/manage/page.tsx` | Add server-side caching |
| `app/api/vocab/*` | Add cache invalidation calls |

### Expected Performance Improvements

- **Study page load:** ~50% faster (cached vocab sets)
- **Set switching:** Instant (words cached after first load)
- **Image loading:** Near-instant (long-term cache)
- **Database load:** Reduced (fewer repeat queries)

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Cache stale data | Use `revalidateTag()` on mutations |
| Build failures | Check for client/server boundary issues |
| User progress confusion | Keep progress data short-cache or uncached |

---

## Next Steps After Implementation

1. **Monitor cache hit rates** in development (Next.js devtools shows cache activity)
2. **Tune cache durations** based on actual content update frequency
3. **Consider `use cache: private`** for user-specific data in multi-user scenarios
4. **Add cache debugging** UI for admin visibility (optional)
