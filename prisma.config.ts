import { defineConfig } from "prisma/config";

// Bun automatically loads .env/.env.local files — no dotenv import needed
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
