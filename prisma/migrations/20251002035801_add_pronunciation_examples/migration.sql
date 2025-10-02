/*
  Warnings:

  - You are about to drop the column `exampleSentence` on the `vocab_words` table. All the data in the column will be lost.
  - You are about to drop the column `imagePrompt` on the `vocab_words` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `vocab_words` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vocab_words" DROP COLUMN "exampleSentence",
DROP COLUMN "imagePrompt",
DROP COLUMN "imageUrl",
ADD COLUMN     "pronunciation" TEXT;

-- CreateTable
CREATE TABLE "vocab_examples" (
    "id" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "imageDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "wordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocab_examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vocab_examples_wordId_idx" ON "vocab_examples"("wordId");

-- AddForeignKey
ALTER TABLE "vocab_examples" ADD CONSTRAINT "vocab_examples_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "vocab_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
