import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

function loadEnvFile(filename: string, override = false) {
  const envPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override, quiet: true });
  }
}

// Support both Node-based `npx prisma ...` commands and Bun-based `bunx --bun prisma ...`.
// Load `.env` first, then let `.env.local` override it for local development.
loadEnvFile(".env");
loadEnvFile(".env.local", true);

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/vocab_ai";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
