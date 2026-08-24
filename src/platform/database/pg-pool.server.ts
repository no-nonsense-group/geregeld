import "@tanstack/react-start/server-only";

import { Pool } from "pg";

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_MAX_CONNECTIONS ?? 4),
});
