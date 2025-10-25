-- CreateTable: game_attempts
CREATE TABLE IF NOT EXISTS "game_attempts" (
    "id" TEXT PRIMARY KEY,
    "profile_id" TEXT NULL,
    "vocab_set_id" TEXT NOT NULL,
    "word_id" TEXT NULL,
    "mode" VARCHAR(40) NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "time_remaining" INTEGER NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "game_attempts_profile_id_idx" ON "game_attempts" ("profile_id");
CREATE INDEX IF NOT EXISTS "game_attempts_vocab_set_id_idx" ON "game_attempts" ("vocab_set_id");
CREATE INDEX IF NOT EXISTS "game_attempts_word_id_idx" ON "game_attempts" ("word_id");
CREATE INDEX IF NOT EXISTS "game_attempts_mode_idx" ON "game_attempts" ("mode");

-- FKs
ALTER TABLE "game_attempts"
  ADD CONSTRAINT "game_attempts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "game_attempts"
  ADD CONSTRAINT "game_attempts_vocab_set_id_fkey" FOREIGN KEY ("vocab_set_id") REFERENCES "vocab_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "game_attempts"
  ADD CONSTRAINT "game_attempts_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "vocab_words" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
