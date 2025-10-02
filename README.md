# 🎓 Vocab AI

An AI-powered vocabulary learning application for elementary students, built with Next.js, Vercel AI SDK, and Google Gemini.

## Features

- 🤖 **AI-Generated Content**: Automatic definitions, examples, and custom illustrations for each word
- 📊 **Progress Tracking**: Monitor mastery levels (0-5 scale) and identify words that need more practice
- 🎯 **Interactive Games**: Matching games and quizzes make learning fun and engaging
- 🎴 **Flashcards**: Study with interactive flashcards
- ⭐ **Mastery System**: 6-level system from "Not Learned" to "Expert"

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI**: Vercel AI SDK + Google Gemini
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Prerequisites

- Node.js 18+ and npm
- Docker (for PostgreSQL)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Getting Started

### 1. Clone and Install

```bash
cd vocab-ai
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google AI (Gemini) API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/vocab_ai?schema=public"
```

### 3. Start PostgreSQL Database

Using Docker Compose:

```bash
docker-compose up -d
```

This will start a PostgreSQL container on port 5432.

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates the database schema with tables for:
- `vocab_sets`: Vocabulary collections (e.g., "Week 1")
- `vocab_words`: Individual words with definitions and images
- `study_progress`: Track student mastery levels

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

## Project Structure

```
vocab-ai/
├── app/
│   ├── api/
│   │   ├── vocab/
│   │   │   ├── process/route.ts    # Process new vocabulary with AI
│   │   │   ├── [id]/route.ts       # Get specific vocab set
│   │   │   └── route.ts            # List all vocab sets
│   │   └── progress/route.ts       # Track learning progress
│   ├── layout.tsx
│   └── page.tsx                    # Homepage
├── lib/
│   ├── gemini.ts                   # Gemini AI utilities
│   └── prisma.ts                   # Prisma client
├── prisma/
│   └── schema.prisma               # Database schema
├── docker-compose.yml              # PostgreSQL setup
└── .env.local                      # Environment variables (create this!)
```

## API Routes

### POST `/api/vocab/process`
Process new vocabulary words with AI

```json
{
  "words": ["aspiring", "rival", "tradition"],
  "vocabSetName": "Week 1",
  "description": "Weekly vocabulary",
  "grade": "3rd Grade"
}
```

### GET `/api/vocab`
List all vocabulary sets

### GET `/api/vocab/[id]`
Get a specific vocabulary set with all words

### POST `/api/progress`
Update learning progress

```json
{
  "wordId": "clx123...",
  "isCorrect": true,
  "userId": null
}
```

### GET `/api/progress`
Get progress for all words or a specific word

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

# Database commands
npx prisma studio              # Open database GUI
npx prisma migrate dev         # Create new migration
npx prisma migrate reset       # Reset database
npx prisma generate            # Regenerate Prisma Client

# Docker commands
docker-compose up -d           # Start PostgreSQL
docker-compose down            # Stop PostgreSQL
docker-compose logs -f         # View logs
```

## Next Steps

1. **Create Vocabulary**: Use the `/create` page to add new words
2. **Study Flashcards**: Review words on the `/study` page
3. **Play Games**: Reinforce learning with `/games`
4. **Track Progress**: View mastery levels on the dashboard

## Planned Features

- 🖼️ Image generation with Gemini
- 🎮 Memory matching game
- ❓ Multiple-choice quiz mode
- 📈 Progress dashboard
- 🔄 Spaced repetition algorithm
- 👥 Multi-user support
- 🎨 Custom themes
- 📱 Mobile app (React Native)

## License

MIT

## Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [Google Gemini](https://ai.google.dev)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
