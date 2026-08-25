import "dotenv/config";

import { defineConfig } from "drizzle-kit";

const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required");
}

const isSqlite = url.startsWith("file:") || process.env.SQLITE_PATH !== undefined;

export default defineConfig(
  isSqlite
    ? {
        dialect: "sqlite",
        schema: "./src/platform/database/schema.sqlite.ts",
        out: "./drizzle/sqlite",
        dbCredentials: {
          url: process.env.SQLITE_PATH
            ? `file:${process.env.SQLITE_PATH}`
            : url,
        },
        strict: true,
        verbose: true,
      }
    : (() => {
        if (new URL(url).hostname.includes("-pooler")) {
          throw new Error(
            "Migrations require a direct database URL, but the configured URL uses a pooled endpoint",
          );
        }

        return {
          dialect: "postgresql",
          schema: "./src/platform/database/schema.pg.ts",
          out: "./drizzle",
          dbCredentials: {
            url,
          },
          strict: true,
          verbose: true,
        };
      })(),
);
