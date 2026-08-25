import { defineConfig } from "drizzle-kit";

const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required");
}

if (new URL(migrationUrl).hostname.includes("-pooler")) {
  throw new Error(
    "Migrations require a direct database URL, but the configured URL uses a pooled endpoint",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/platform/database/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: migrationUrl,
  },
  strict: true,
  verbose: true,
});
