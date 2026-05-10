import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // prisma/config env() hard-throws when the variable is missing, which
    // breaks `prisma generate` in CI (postinstall) where DATABASE_URL is not
    // set. process.env + fallback lets generate succeed without a database
    // connection; runtime queries still require a real DATABASE_URL via
    // Azure App Settings / .env.local.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/catprep",
  },
});
