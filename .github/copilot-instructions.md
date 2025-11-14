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
- Database: postgres on 192.168.1.254:5432 (default)
- Studio (UI): http://192.168.1.254:5432
- Ensure your `DATABASE_URL` points to the local Supabase Postgres instance.

### Database Commands
- `npm run db:studio` - Prisma Studio GUI
- `npm run db:push` - Push schema changes (dev only)
- `npm run db:migrate` - Create new migration
- `npm run db:reset` - Reset database