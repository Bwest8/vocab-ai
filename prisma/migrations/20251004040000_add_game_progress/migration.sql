-- CreateTable
CREATE TABLE "game_profiles" (
    "id" TEXT NOT NULL,
    "profile_key" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "questions_attempted" INTEGER NOT NULL DEFAULT 0,
    "questions_correct" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "current_combo" INTEGER NOT NULL DEFAULT 0,
    "best_combo" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_profiles_profile_key_key" UNIQUE ("profile_key")
);

-- CreateTable
CREATE TABLE "game_mode_progress" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "vocab_set_id" TEXT NOT NULL,
    "mode" VARCHAR(40) NOT NULL,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_mode_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_mode_progress_profile_id_vocab_set_id_mode_key" UNIQUE ("profile_id", "vocab_set_id", "mode"),
    CONSTRAINT "game_mode_progress_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "game_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "game_mode_progress_vocab_set_id_fkey" FOREIGN KEY ("vocab_set_id") REFERENCES "vocab_sets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "game_mode_progress_vocab_set_id_idx" ON "game_mode_progress" ("vocab_set_id");

-- CreateIndex
CREATE INDEX "game_mode_progress_profile_id_idx" ON "game_mode_progress" ("profile_id");
