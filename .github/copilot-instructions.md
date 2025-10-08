# Vocab AI - Copilot Instructions

## Project Overview
Elementary vocabulary learning app (grades 4-6) using AI-generated content. Next.js 15 + App Router, PostgreSQL via Prisma, Google Gemini (text/image generation), xAI Grok (alternative processor), ElevenLabs (TTS).

## Architecture Decisions

### AI Processing Flow (Critical)
- **Batch Processing**: `/api/vocab/create` sends raw text to AI processor (xAI Grok by default, Gemini fallback)
- **Single Request**: AI parses ALL words + definitions in one call, returns structured JSON with 5 examples each
- **On-Demand Images**: Images generated lazily via `/api/vocab/[id]/examples/[exampleId]/generate-image` (not during word creation)
- **Processor Toggle**: Switch between `xaiVocabProcessor.ts` (Grok) and `geminiVocabProcessor.ts` by changing import in `/app/api/vocab/create/route.ts`

### Database & State Management
- **Prisma Schema**: `VocabSet` → `VocabWord` → `VocabExample` cascade relationships
- **Game Profiles**: Uses `profileKey` (default: "vocab-ai-player") for multi-user support - NOT userId
- **Progress Tracking**: Two systems - `StudyProgress` (0-5 mastery) and `GameModeProgress` (per-mode stats)
- **No userId**: App is single-user by design; `userId` field exists in schema but is always null

### Next.js 15 Specifics
- **Turbopack Dev Mode**: Run `npm run dev` (uses `--turbopack` flag)
- **PWA Production Only**: `next-pwa` wrapper only active in production builds
- **Async Params**: Route params are Promises in Next.js 15 - always `await params` in dynamic routes

## Key Workflows

### Development Setup
```bash
npm install
docker-compose up -d           # PostgreSQL 18 on port 5432
npx prisma migrate dev         # Run migrations
npx prisma generate            # Generate client
npm run dev                    # Start with Turbopack
```

### Database Commands
- `npm run db:studio` - Prisma Studio GUI
- `npm run db:push` - Push schema changes (dev only)
- `npm run db:migrate` - Create new migration
- `npm run db:reset` - Reset database

### Environment Variables Required
```
GOOGLE_GENERATIVE_AI_API_KEY   # Gemini (text + image generation)
GEMINI_API_KEY                 # Alias for Gemini
XAI_API_KEY                    # xAI Grok (primary vocab processor)
ELEVENLABS_API_KEY             # Text-to-speech
DATABASE_URL                   # PostgreSQL connection
```

## Code Patterns

### API Route Structure
```typescript
// Next.js 15: params are Promises
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### Prisma Client Access
- Import from `@/lib/prisma` (singleton pattern)
- Always include relations: `include: { words: { include: { examples: true, progress: true } } }`

### Mastery Level Calculation
- Use `toMasteryLevel()` from `lib/study/utils.ts` to convert 0-100 to 0-5 scale
- Progress updates via `upsertProgressList()` helper

### Game Modes
Located in `app/components/GameModes.tsx`:
- `definition-match` (10 pts) - Match word to definition
- `reverse-definition` (12 pts) - Match definition to word
- `fill-in-the-blank` (14 pts) - Complete sentence
- `speed-round` (8 pts) - Rapid fire questions

### Image Generation
- Files stored in `public/vocab-sets/{setId}/{exampleId}.{ext}` (or `$VOCAB_IMAGES_DIR` if set)
- **Production Mode**: Uses API route `/api/images/vocab-sets/...` to serve from custom storage
- **Development Mode**: Direct public path `/vocab-sets/...` works via symlinks
- Returns `{ publicUrl, fullPath, mimeType, sizeKB }`
- Uses Gemini 2.5 Flash Image model
- Auto-cleanup: DELETE routes remove filesystem files

### TTS Caching
- MD5 hash of `text:voiceId` determines cache filename
- Stored in `public/audio/tts/{hash}.mp3` (or `$TTS_CACHE_DIR` if set)
- **Production Mode**: Returns `{ url: "/api/audio/tts/{hash}.mp3" }` for custom storage
- **Development Mode**: Returns audio blob directly or via symlink
- Cache-Control: 1 year for cached files

## Common Patterns

### State Hook Pattern
Both `useStudySession.ts` and `useGamesSession.ts` follow:
```typescript
const [setState, setSetState] = useState<FetchState>("idle" | "loading" | "error");
const [words, setWords] = useState<WordWithRelations[]>([]);
```

### Word Selection Logic (Games)
- Weekly limit: 12 words from latest lesson (check name for highest "Lesson X" number)
- Review words: mastery < 3 from all sets
- Option pool: combine weekly + review + all words for multiple choice

### Type Imports
- Study types: `@/lib/study/types`
- Global types: `@/lib/types`
- Prisma types: `@prisma/client`

## File Organization
```
app/
  api/
    vocab/create/         # AI batch processing endpoint
    vocab/[id]/examples/[exampleId]/generate-image/  # On-demand image gen
    games/profile/        # Game profile CRUD
    games/progress/       # Game progress tracking
    tts/                  # ElevenLabs TTS with caching
  components/            # Shared UI components
  study/, games/, create/, manage/, parent/  # Feature pages
lib/
  geminiVocabProcessor.ts    # Gemini-based word processing
  xaiVocabProcessor.ts       # xAI Grok-based (default)
  hooks/                     # Shared state management
  study/utils.ts             # Mastery calculations
```

## Gotchas

1. **Image URLs**: In production with custom storage, use API routes (`/api/images/vocab-sets/...`); in dev, direct paths work
2. **Game Profiles**: Always use `profileKey`, never `userId` for lookups
3. **Migrations**: Schema changes must use `npx prisma migrate dev --name description`
4. **Public Directory**: Ignore `/public/vocab-sets/*` and `/public/audio/*` in git
5. **AI Responses**: Use `jsonrepair` library to fix malformed JSON from AI models
6. **Turbopack**: Some configs don't apply in dev mode (e.g., PWA settings)
7. **Custom Storage**: Set `TTS_CACHE_DIR` and `VOCAB_IMAGES_DIR` env vars to store files outside `public/` (useful for macOS external drives)
8. **Production Symlinks**: Next.js doesn't follow symlinks in production builds - use API routes instead

## Testing/Debugging
- Check Prisma Studio for data inspection
- TTS cache at `public/audio/tts/` (or `$TTS_CACHE_DIR` if set)
- Generated images at `public/vocab-sets/{setId}/` (or `$VOCAB_IMAGES_DIR` if set)
- Docker logs: `npm run docker:logs`
- Database issues: `npm run db:reset` (destructive!)