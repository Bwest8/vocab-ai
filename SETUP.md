# Quick Setup Guide

Follow these steps to get Vocab AI running:

## 1. Get Your Gemini API Key

1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## 2. Configure Environment

Open `.env.local` and add your API key:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
DATABASE_URL="postgresql://postgres:password@localhost:5432/vocab_ai?schema=public"
```

## 3. Start Database

```bash
npm run docker:up
```

Wait 10 seconds for PostgreSQL to be ready.

## 4. Initialize Database

```bash
npm run db:migrate
```

When prompted, enter a name for the migration (e.g., "init").

## 5. Start Development Server

```bash
npm run dev
```

## 6. Test the Setup

Open http://localhost:3000 in your browser.

## Test the API

Create a test vocabulary set:

```bash
curl -X POST http://localhost:3000/api/vocab/process \
  -H "Content-Type: application/json" \
  -d '{
    "words": ["happy", "sad", "excited"],
    "vocabSetName": "Emotions Test",
    "grade": "2nd Grade"
  }'
```

You should see a response with processed words!

## Troubleshooting

### Database Connection Error
- Make sure Docker is running: `docker ps`
- Check if PostgreSQL is healthy: `npm run docker:logs`
- Verify DATABASE_URL in `.env.local`

### Gemini API Error
- Verify your API key is correct in `.env.local`
- Check your API quota at https://aistudio.google.com
- Make sure there are no extra spaces in the key

### Module Not Found Errors
- Run `npm install` again
- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma Client: `npm run db:generate`

## Useful Commands

```bash
# View database in GUI
npm run db:studio

# Reset database (WARNING: Deletes all data!)
npm run db:reset

# View PostgreSQL logs
npm run docker:logs

# Stop database
npm run docker:down
```

## Next Steps

1. Visit http://localhost:3000
2. Click "Create Vocabulary"
3. Add your first words
4. Start learning!

Happy coding! 🚀
