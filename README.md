# 🎓 Vocab AI

AI-powered vocabulary learning for grades 4–6 built with Next.js 16, PostgreSQL (Prisma), Google Gemini, xAI Grok, and ElevenLabs.

## Features

- 🤖 AI batch processing: paste raw word/definition text, generate structured lessons in one call
- 🖼️ On-demand images: generate illustrations per example sentence when needed
- 🔊 Text-to-speech with caching (ElevenLabs)
- 🎴 Flashcards and 📊 mastery tracking (0–5)
- 🎮 Multiple game modes with scoring and a weekly practice profile
- 💾 Custom storage for audio/images served via API routes (production safe)

## Tech Stack

- Framework: Next.js 16 (App Router, Turbopack in dev)
- AI: xAI Grok (default) for text processing, Google Gemini as fallback; Gemini 2.5 Flash Image for images
- Database: PostgreSQL 18 via Prisma ORM
- Styling: Tailwind CSS v4 + shadcn/ui base components
- Language: TypeScript

## Prerequisites

- Bun 1.1+
- PostgreSQL 18 (local or Docker)
- API keys: Google Gemini, xAI Grok, ElevenLabs

## Getting Started

### 1) Install dependencies

```bash
bun install
```

### 2) Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database (local PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# AI (text/image)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_image_api_key   # Gemini images
GEMINI_API_KEY=your_gemini_text_api_key                  # Gemini text (fallback processor)
XAI_API_KEY=your_xai_grok_api_key                        # Default vocab processor
GROK_MODEL_ID=grok-4-fast                                # optional override
GEMINI_TEXT_MODEL_ID=gemini-2.5-flash                    # optional override

# TTS (audio)
ELEVENLABS_API_KEY=your_elevenlabs_key

# Custom storage (absolute paths)
VOCAB_IMAGES_DIR=/DATA/AppData/vocab-ai/vocab-sets
TTS_CACHE_DIR=/DATA/AppData/vocab-ai/tts
```

### 3) Start PostgreSQL (Docker)

```bash
docker compose up -d
```

### 4) Run database migrations

```bash
bun x prisma migrate dev --name init
```

Creates schema:
- `vocab_sets` (collections)
- `vocab_words` (words + relations)
- `vocab_examples` (sentences + image descriptions + urls)
- `study_progress` (0–5 mastery)
- `game_profiles` and `game_mode_progress` (weekly practice)

### 5) Generate Prisma client

```bash
bun x prisma generate
```

### 6) Start development server

```bash
bun run dev
```

Open http://localhost:3000

## Docker Compose

You can run Postgres (and the app) with Docker Compose using variables from `.env`.

1) Copy `.env.example` to `.env` and edit values (absolute paths for storage are recommended):

```bash
cp .env.example .env
```

2) Create the host directories referenced in `.env` (only needs to be done once):

```bash
mkdir -p /DATA/AppData/postgresql \
         /DATA/AppData/vocab-ai/vocab-sets \
         /DATA/AppData/vocab-ai/tts
```

3) Start the stack:

```bash
docker compose up -d
```

What it does:
- Starts PostgreSQL 18 on port 5432 and stores data under `/DATA/AppData/postgresql`
- Starts the Next.js app on http://localhost:3000 after applying Prisma migrations
- Uses `${VOCAB_IMAGES_DIR}` and `${TTS_CACHE_DIR}` as bind-mounted storage for images and audio

Notes:
- Compose reads substitution variables from `.env` automatically
- Avoid `~` in path values inside `.env`; use absolute paths instead
- For beta/production-style deployments, use a stable persistent mount for PostgreSQL data. Do not rely on an ephemeral container filesystem.
- `bun run db:reset` is intentionally guarded and will refuse to wipe data unless `ALLOW_DB_RESET=true` is set or `bun run db:reset:force` is used deliberately.

## Project Structure

```
vocab-ai/
├── app/
│   ├── api/
│   │   ├── vocab/
│   │   │   ├── create/route.ts                       # AI batch processing (xAI Grok default)
│   │   │   ├── [id]/route.ts                         # Get/update/delete a vocab set
│   │   │   ├── [id]/images/route.ts                  # DELETE clear set images
│   │   │   ├── [id]/examples/[exampleId]/generate-image/route.ts  # On-demand image gen
│   │   │   └── route.ts                              # List all vocab sets
│   │   ├── images/vocab-sets/[...path]/route.ts      # Serve images from custom storage
│   │   ├── tts/route.ts                              # ElevenLabs TTS with caching
│   │   ├── audio/tts/[filename]/route.ts             # Serve cached TTS audio
│   │   ├── games/profile/route.ts                    # Weekly profile
│   │   ├── games/progress/route.ts                   # Game progress tracking
│   │   ├── games/attempts/route.ts                   # Game attempts tracking
│   │   └── games/word-progress/route.ts              # Word progress stats
│   │   └── progress/route.ts                         # Study progress
│   ├── components/
│   │   ├── ui/                                       # shadcn/ui components
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── HamburgerMenu.tsx
│   │   ├── PageHeader.tsx
│   │   ├── GameDashboard.tsx
│   │   └── GameModeSelector.tsx
│   ├── games/
│   │   ├── components/
│   │   │   ├── shared/                               # Shared game components
│   │   │   ├── DefinitionMatchGame.tsx
│   │   │   ├── MatchingGame.tsx
│   │   │   ├── WordScrambleGame.tsx
│   │   │   ├── FillInTheBlankGame.tsx
│   │   │   ├── ReverseDefinitionGame.tsx
│   │   │   └── SpeedRoundGame.tsx
│   │   └── [mode]/page.tsx                           # Game mode pages
│   ├── study/
│   │   ├── components/
│   │   │   ├── StudyFlashcard.tsx
│   │   │   ├── StudyControls.tsx
│   │   │   ├── StudyHeader.tsx
│   │   │   ├── StudyImageModal.tsx
│   │   │   └── StudyWordList.tsx
│   │   └── hooks/useStudySession.ts
│   ├── create/page.tsx                               # Create vocab sets
│   ├── manage/page.tsx                               # Manage vocab sets
│   ├── parent/
│   │   ├── page.tsx                                  # Parent dashboard
│   │   └── print-matching/[setId]/page.tsx           # Print matching activities
│   ├── layout.tsx
│   └── page.tsx                                      # Homepage
├── lib/
│   ├── hooks/
│   │   ├── useGameProgress.ts
│   │   ├── useGamesSession.ts
│   │   └── useWordProgress.ts
│   ├── study/
│   │   ├── utils.ts                                  # Mastery calculations
│   │   └── types.ts                                  # Study-specific types
│   ├── types.ts                                      # Global types
│   ├── prisma.ts                                     # Prisma client
│   ├── gemini.ts                                     # Gemini client helpers
│   ├── geminiCreateImage.ts                          # Generate and persist images
│   ├── xaiVocabProcessor.ts                          # xAI Grok processor (default)
│   ├── geminiVocabProcessor.ts                       # Gemini processor (fallback)
│   ├── utils.ts                                      # General utilities
│   └── server/vocab.ts                               # Server-side vocab helpers
├── prisma/
│   ├── schema.prisma                                 # Database schema
│   └── migrations/                                   # Migration files
├── components.json                                   # shadcn/ui config
├── dockerfile
├── docker-compose.yml
├── next.config.ts
├── package.json
├── tailwind.config.mjs
├── tsconfig.json
└── .env.local                                        # Environment variables (create this!)
```

## API Routes

### POST /api/vocab/create
Create a new set by pasting raw word+definition text. The AI parses all words in one request and returns 5 examples per word. On success, words and examples are written to the DB.

Payload:
```json
{
  "rawText": "1) WORD — definition...\n2) ...",
  "vocabSetName": "Lesson 12",
  "description": "Weekly vocabulary",
  "grade": "5th Grade"
}
```

### GET /api/vocab
List all sets (with word IDs/names)

### GET /api/vocab/[id]
Get a set with `words`, `examples`, and study `progress`

### PATCH /api/vocab/[id]
Update set name/description/grade

### DELETE /api/vocab/[id]
Delete set and cascade words/examples; also deletes any image files on disk

### DELETE /api/vocab/[id]/images
Remove all generated images for a set and clear `imageUrl` fields

### POST /api/vocab/[id]/examples/[exampleId]/generate-image
Generate an illustration for one example using its `imageDescription`. Files are saved under `$VOCAB_IMAGES_DIR/{setId}/...` and served via `/api/images/vocab-sets/{setId}/{filename}`.

### GET /api/images/vocab-sets/[...path]
Serve images from `$VOCAB_IMAGES_DIR` with proper MIME and long cache

### GET /api/tts?text=hello&voiceId=...
Generate TTS audio with caching. Returns `{ url: "/api/audio/tts/{hash}.mp3" }`.

### GET /api/audio/tts/[filename]
Serve cached TTS files from `$TTS_CACHE_DIR`

### POST /api/progress
Update study progress per word (mastery 0–5)

### GET /api/progress
Fetch progress records (optionally filter by `wordId`/`userId`)

### GET /api/games/profile?setId=...&profileKey=default
Get or create the weekly practice profile and per-mode progress for a set

### POST /api/games/progress
Record a game result for the active set and mode; updates points, streak, combo, and per-mode stats

### GET /api/games/word-progress
Fetch word-by-word progress statistics for a set

## Database Schema

### VocabSet
- Represents a collection of words (e.g., "Week 1")
- Fields: name, description, grade, timestamps

### VocabWord
- Individual vocabulary word
- Fields: word, definition, teacherDefinition, pronunciation, partOfSpeech, timestamps
- Relations: belongs to a vocab set, has many examples, has many progress records

### VocabExample
- Example sentences and image descriptions for each word
- Fields: sentence, imageDescription, imageUrl, timestamps
- Relations: belongs to a vocab word

### StudyProgress
- Tracks student progress per word
- Fields: correctCount, incorrectCount, masteryLevel (0-5), lastStudied

### GameProfile
- Weekly practice profile for a set
- Fields: profileKey, points, streak, combo, accuracy, timestamps

### GameModeProgress
- Per-mode progress tracking
- Fields: mode, attempted, correct, completed, timestamps

## Mastery Levels

- **0**: Not learned / Forgotten
- **1**: Seen once
- **2**: Partially learned
- **3**: Mostly learned
- **4**: Mastered
- **5**: Expert (consistently correct)

## Next Steps

1) Create a new set: use the Create page (`/create`) and paste raw word text
2) Study: review with flashcards (`/study`)
3) Games: practice modes under `/games` (Definition Match, Reverse Definition, Fill in the Blank, Speed Round, Matching, Word Scramble)
4) Images: generate per-example illustrations on demand
5) Manage: edit and curate vocabulary sets at `/manage`
6) Parent Dashboard: track progress and print activities at `/parent`

## Notes & Gotchas

- Image and audio are served via API routes to support custom storage in production (Next.js static server won't follow symlinks)
- Set `VOCAB_IMAGES_DIR` and `TTS_CACHE_DIR` to absolute paths
- Game profiles use `profileKey` (default "default"); there is no userId-based auth
- Some dev configs don't apply with Turbopack; build-time PWA settings are production-only
- AI processors can be toggled in `/api/vocab/create/route.ts` (xAI Grok default, Gemini fallback)
- Next.js 16 uses async params - always `await params` in dynamic routes

## License

MIT

## Credits

Built with ❤️ using:
- Next.js
- Google Gemini + xAI Grok
- Prisma
- Tailwind CSS
