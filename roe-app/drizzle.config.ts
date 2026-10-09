import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit generate/migrate only; never commit real URL
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/roe",
  },
});
