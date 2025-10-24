# 🎓 Vocab AI

AI-powered vocabulary learning for grades 4–6 built with Next.js 15, PostgreSQL (Prisma), Google Gemini, xAI Grok, and ElevenLabs.

## Features

- 🤖 AI batch processing: paste raw word/definition text, generate structured lessons in one call
- 🖼️ On-demand images: generate illustrations per example sentence when needed
- 🔊 Text-to-speech with caching (ElevenLabs)
- 🎴 Flashcards and 📊 mastery tracking (0–5)
- 🎮 Multiple game modes with scoring and a weekly practice profile
- 💾 Custom storage for audio/images served via API routes (production safe)

## Tech Stack

- Framework: Next.js 15 (App Router, Turbopack in dev)
- AI: xAI Grok (default) for text processing, Google Gemini as fallback; Gemini 2.5 Flash Image for images
- Database: PostgreSQL 18 via Prisma ORM
- Styling: Tailwind CSS v4 + shadcn/ui base components
- Language: TypeScript

## Prerequisites

- Node.js 18+ and npm
- Local Supabase (PostgreSQL) running on your machine
- API keys: Google Gemini, xAI Grok, ElevenLabs

## Getting Started

### 1) Install dependencies

```bash
cd vocab-ai
npm install
```

### 2) Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database (local Supabase default ports)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

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

### 3) Ensure local Supabase is running

- Postgres host/port: localhost:5432
- Verify your `DATABASE_URL` points to the local Supabase Postgres instance (see above)

### 4) Run database migrations

```bash
npx prisma migrate dev --name init
```

Creates schema:
- `vocab_sets` (collections)
- `vocab_words` (words + relations)
- `vocab_examples` (sentences + image descriptions + urls)
- `study_progress` (0–5 mastery)
- `game_profiles` and `game_mode_progress` (weekly practice)

### 5) Generate Prisma client

```bash
npx prisma generate
```

### 6) Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Docker Compose (optional)

```bash
git clone https://github.com/Bwest8/vocab-ai.git
```

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
- Starts PostgreSQL 18 on `${POSTGRES_HOST_PORT}` (defaults to 5432) and stores data under `${POSTGRES_DATA_DIR}`
- Starts the Next.js app on http://localhost:3000 after applying Prisma migrations
- Uses `${VOCAB_IMAGES_DIR}` and `${TTS_CACHE_DIR}` as bind-mounted storage for images and audio

Notes:
- Compose reads substitution variables from `.env` automatically. We also include `env_file: .env` so variables are available inside containers.
- 5432 is the default host port in this compose file; change `POSTGRES_HOST_PORT` only if 5432 is already in use.
- Avoid `~` in path values inside `.env`; use absolute paths instead.

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
│   │   └── games/progress/route.ts                   # Game progress tracking
│   ├── layout.tsx
│   └── page.tsx                    # Homepage
├── lib/
│   ├── gemini.ts                   # Gemini client helpers
│   ├── geminiCreateImage.ts        # Generate and persist images
│   └── prisma.ts                   # Prisma client
├── prisma/
│   └── schema.prisma               # Database schema
└── .env.local                      # Environment variables (create this!)
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

## Database Schema

### VocabSet
- Represents a collection of words (e.g., "Week 1")
- Fields: name, description, grade, timestamps

### VocabWord
- Individual vocabulary word
- Fields: word, definition, pronunciation, partOfSpeech, timestamps
- Relations: belongs to a vocab set, has many examples, has many progress records

### VocabExample
- Example sentences and image descriptions for each word
- Fields: sentence, imageDescription, imageUrl, timestamps
- Relations: belongs to a vocab word

### StudyProgress
- Tracks student progress per word
- Fields: correctCount, incorrectCount, masteryLevel (0-5), lastStudied

## Mastery Levels

- **0**: Not learned / Forgotten
- **1**: Seen once
- **2**: Partially learned
- **3**: Mostly learned
- **4**: Mastered
- **5**: Expert (consistently correct)

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database (package.json scripts)
npm run db:studio
npm run db:migrate
npm run db:reset
npm run db:generate
npm run db:push        # dev-only schema push

# Supabase (local)
# Studio UI: http://localhost:54323/
# Postgres:   localhost:54322
```

## Next Steps

1) Create a new set: use the Create page (`/create`) and paste raw word text
2) Study: review with flashcards (`/study`)
3) Games: practice modes under `/games` (Definition Match, Reverse Definition, Fill in the Blank, Speed Round, Matching, Word Scramble)
4) Images: generate per-example illustrations on demand

## Notes & Gotchas

- Image and audio are served via API routes to support custom storage in production (Next.js static server won’t follow symlinks)
- Set `VOCAB_IMAGES_DIR` and `TTS_CACHE_DIR` to absolute paths
- Game profiles use `profileKey` (default "default"); there is no userId-based auth
- Some dev configs don’t apply with Turbopack; build-time PWA settings are production-only

## License

MIT

## Credits

Built with ❤️ using:
- Next.js
- Google Gemini + xAI Grok
- Prisma
- Tailwind CSS
