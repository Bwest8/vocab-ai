-- No-op placeholder for rolled-back migration 20251004182515_games.-- No-op placeholder for rolled-back migration 20251004182515_games.-- This migration was generated during development but rolled back before applying./*



SELECT 1;SELECT 1;


-- It remains as a no-op placeholder so that Prisma's migration history stays in sync.  Warnings:


  - You are about to drop the column `completed_at` on the `game_mode_progress` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `game_mode_progress` table. All the data in the column will be lost.
  - You are about to drop the column `last_played_at` on the `game_mode_progress` table. All the data in the column will be lost.
  - You are about to drop the column `profile_id` on the `game_mode_progress` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `game_mode_progress` table. All the data in the column will be lost.
  - You are about to drop the column `vocab_set_id` on the `game_mode_progress` table. All the data in the column will be lost.
  - You are about to drop the column `best_combo` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `current_combo` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `last_played_at` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `profile_key` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `questions_attempted` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `questions_correct` on the `game_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `game_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profileId,vocabSetId,mode]` on the table `game_mode_progress` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileKey]` on the table `game_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `game_mode_progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `game_mode_progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vocabSetId` to the `game_mode_progress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileKey` to the `game_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `game_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."game_mode_progress" DROP CONSTRAINT "game_mode_progress_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."game_mode_progress" DROP CONSTRAINT "game_mode_progress_vocab_set_id_fkey";

-- DropIndex
DROP INDEX "public"."game_mode_progress_profile_id_idx";

-- DropIndex
DROP INDEX "public"."game_mode_progress_profile_id_vocab_set_id_mode_key";

-- DropIndex
DROP INDEX "public"."game_mode_progress_vocab_set_id_idx";

-- DropIndex
DROP INDEX "public"."game_profiles_profile_key_key";

-- AlterTable
ALTER TABLE "game_mode_progress" DROP COLUMN "completed_at",
DROP COLUMN "created_at",
DROP COLUMN "last_played_at",
DROP COLUMN "profile_id",
DROP COLUMN "updated_at",
DROP COLUMN "vocab_set_id",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastPlayedAt" TIMESTAMP(3),
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vocabSetId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "game_profiles" DROP COLUMN "best_combo",
DROP COLUMN "created_at",
DROP COLUMN "current_combo",
DROP COLUMN "last_played_at",
DROP COLUMN "profile_key",
DROP COLUMN "questions_attempted",
DROP COLUMN "questions_correct",
DROP COLUMN "updated_at",
ADD COLUMN     "bestCombo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentCombo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastPlayedAt" TIMESTAMP(3),
ADD COLUMN     "profileKey" TEXT NOT NULL,
ADD COLUMN     "questionsAttempted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "game_mode_progress_vocabSetId_idx" ON "game_mode_progress"("vocabSetId");

-- CreateIndex
CREATE INDEX "game_mode_progress_profileId_idx" ON "game_mode_progress"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "game_mode_progress_profileId_vocabSetId_mode_key" ON "game_mode_progress"("profileId", "vocabSetId", "mode");

-- CreateIndex
CREATE UNIQUE INDEX "game_profiles_profileKey_key" ON "game_profiles"("profileKey");

-- AddForeignKey
ALTER TABLE "game_mode_progress" ADD CONSTRAINT "game_mode_progress_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "game_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_mode_progress" ADD CONSTRAINT "game_mode_progress_vocabSetId_fkey" FOREIGN KEY ("vocabSetId") REFERENCES "vocab_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
