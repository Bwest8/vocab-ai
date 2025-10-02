-- CreateTable
CREATE TABLE "vocab_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocab_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_words" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "exampleSentence" TEXT,
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "vocabSetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocab_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_progress" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "userId" TEXT,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "lastStudied" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocab_words_vocabSetId_idx" ON "vocab_words"("vocabSetId");

-- CreateIndex
CREATE INDEX "study_progress_wordId_idx" ON "study_progress"("wordId");

-- CreateIndex
CREATE INDEX "study_progress_userId_idx" ON "study_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "study_progress_wordId_userId_key" ON "study_progress"("wordId", "userId");

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "vocab_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_progress" ADD CONSTRAINT "study_progress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "vocab_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
