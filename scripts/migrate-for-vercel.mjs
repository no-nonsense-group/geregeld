import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const { Pool } = pg;
const migrationLock = [1_199_373_058, 1_836_021_092];

function productionMigrationUrl() {
  const value = process.env.DATABASE_URL_UNPOOLED?.trim();

  if (!value) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is required for production migrations",
    );
  }

  const url = new URL(value);

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL_UNPOOLED must be a PostgreSQL URL");
  }

  if (url.hostname.includes("-pooler")) {
    throw new Error(
      "DATABASE_URL_UNPOOLED points to a pooled endpoint; migrations require the direct endpoint",
    );
  }

  return value;
}

async function runProductionMigrations() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Skipping database migrations outside Vercel production");
    return;
  }

  if (process.env.VERCEL !== "1") {
    throw new Error("Production migrations may only run inside Vercel");
  }

  const pool = new Pool({
    connectionString: productionMigrationUrl(),
    connectionTimeoutMillis: 10_000,
    max: 1,
  });
  let client;

  try {
    client = await pool.connect();
    console.log("Waiting for the Geregeld database migration lock");
    await client.query("select pg_advisory_lock($1, $2)", migrationLock);

    console.log("Applying pending database migrations");
    await migrate(drizzle(client), {
      migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
    });
    console.log("Database migrations are current");
  } finally {
    if (client) {
      await client
        .query("select pg_advisory_unlock($1, $2)", migrationLock)
        .catch(() => undefined);
      client.release();
    }
    await pool.end();
  }
}

await runProductionMigrations();
