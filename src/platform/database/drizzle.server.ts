import "@tanstack/react-start/server-only";

import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

import { pgPool } from "./pg-pool.server";
import * as schema from "./schema";
import { isSqlite } from "./schema";

const SQLITE_DEFAULT_PATH = "geregeld.local.db";

function sqliteUrl() {
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  const path = process.env.SQLITE_PATH ?? SQLITE_DEFAULT_PATH;
  return path.startsWith("file:") ? path : `file:${path}`;
}

export const database = (
  isSqlite
    ? drizzleLibsql(createClient({ url: sqliteUrl() }), { schema })
    : drizzlePg(pgPool, { schema })
) as NodePgDatabase<typeof schema>;
