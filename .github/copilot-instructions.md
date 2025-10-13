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
npx prisma migrate dev         # Run migrations (requires local Supabase/Postgres)
npx prisma generate            # Generate client
npm run dev                    # Start with Turbopack
```

Supabase (local):
- Database: postgres on localhost:54322 (default)
- Studio (UI): http://localhost:54323/
- Ensure your `DATABASE_URL` points to the local Supabase Postgres instance.

### Database Commands
- `npm run db:studio` - Prisma Studio GUI
- `npm run db:push` - Push schema changes (dev only)
- `npm run db:migrate` - Create new migration
- `npm run db:reset` - Reset database
````instructions
# Vocab AI - Copilot Instructions

## Project Overview
Elementary vocabulary learning app (grades 4-6) using AI-generated content. Next.js 15 + App Router, PostgreSQL via Prisma, Google Gemini (text/image generation), xAI Grok (alternative processor), ElevenLabs (TTS).

## Architecture Decisions

### AI Processing Flow (Critical)
- **Batch Processing**: `/api/vocab/create` sends raw text to the AI processor (xAI Grok by default, Gemini fallback)
- **Single Request**: AI parses ALL words + definitions in one call, returns structured JSON with 5 examples each
- **On-Demand Images**: Images are generated lazily via `/api/vocab/[id]/examples/[exampleId]/generate-image` (not during word creation)
- **Processor Toggle**: Switch between `xaiVocabProcessor.ts` (Grok) and `geminiVocabProcessor.ts` by changing the import in `/app/api/vocab/create/route.ts`

### Database & State Management
- **Prisma Schema**: `VocabSet` → `VocabWord` → `VocabExample` cascade relationships
- **Game Profiles**: Uses `profileKey` (default: "default") for multi-user support - NOT userId
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
- `npm run db:generate` - Regenerate Prisma client

### Environment Variables Required
```
GOOGLE_GENERATIVE_AI_API_KEY   # Gemini (image generation)
GEMINI_API_KEY                 # Gemini text generation (alternative processor)
XAI_API_KEY                    # xAI Grok (primary vocab processor by default)
ELEVENLABS_API_KEY             # Text-to-speech
DATABASE_URL                   # PostgreSQL connection
VOCAB_IMAGES_DIR               # Absolute path where vocab images are stored
TTS_CACHE_DIR                  # Absolute path where TTS mp3 cache is stored
# Optional overrides
GROK_MODEL_ID                  # Default: grok-4-fast
GEMINI_TEXT_MODEL_ID           # Default: gemini-2.5-flash
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
- Use `toMasteryLevel()` from `lib/study/utils.ts` to normalize to 0-5 scale
- Progress updates via `upsertProgressList()` helper

### Game Modes
Components live in `app/games/components/` and are routed via `app/games/[mode]/page.tsx`.
- `definition-match` (approx 10 pts per correct)
- `reverse-definition` (approx 12 pts per correct)
- `fill-in-the-blank` (approx 14 pts per correct)
- `speed-round` (time-bonus scoring)
- `matching`
- `word-scramble`

### Image Generation
- Files are written under `$VOCAB_IMAGES_DIR/{setId}/...` and are always served via the API route `/api/images/vocab-sets/{setId}/{filename}`
- Result shape from generator: `{ publicUrl, absolutePath, fileName, mimeType }`
- Uses Gemini 2.5 Flash Image model
- Auto-cleanup: `DELETE /api/vocab/[id]/images` removes files and clears DB URLs; deleting a set also deletes image files

### TTS Caching
- MD5 hash of `text:voiceId` determines cache filename
- Stored in `$TTS_CACHE_DIR/{hash}.mp3`
- Returns `{ url: "/api/audio/tts/{hash}.mp3" }` (client fetches the audio by URL)
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
    vocab/[id]/images/     # DELETE to clear set images
    games/profile/        # Game profile CRUD
    games/progress/       # Game progress tracking
    tts/                  # ElevenLabs TTS with caching
    images/vocab-sets/    # Serve images from custom storage
  components/            # Shared UI components
  study/, games/, create/, manage/, parent/  # Feature pages
lib/
  geminiVocabProcessor.ts    # Gemini-based word processing
  xaiVocabProcessor.ts       # xAI Grok-based (default)
  hooks/                     # Shared state management
  study/utils.ts             # Mastery calculations
```

## Gotchas

1. **Image URLs**: Use API routes (`/api/images/vocab-sets/...`) especially in production (symlinks not followed)
2. **Game Profiles**: Always use `profileKey`, never `userId` for lookups
3. **Migrations**: Schema changes must use `npx prisma migrate dev --name description`
4. **Public Directory**: Ignore `/public/vocab-sets/*` and `/public/audio/*` in git
5. **AI Responses**: Processors parse strict JSON; `jsonrepair` is available if recovery is needed
6. **Turbopack**: Some configs don't apply in dev mode (e.g., PWA settings)
7. **Custom Storage**: Set `TTS_CACHE_DIR` and `VOCAB_IMAGES_DIR` to absolute paths; assets are served via API routes
8. **Production Symlinks**: Next.js doesn't follow symlinks in production builds - API routes avoid this

## Testing/Debugging
- Check Prisma Studio for data inspection
- TTS cache at `$TTS_CACHE_DIR`
- Generated images at `$VOCAB_IMAGES_DIR/{setId}/`
- Database issues: `npm run db:reset` (destructive!)
````