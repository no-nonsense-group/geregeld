import "@tanstack/react-start/server-only";

import { drizzle } from "drizzle-orm/node-postgres";

import { pgPool } from "./pg-pool.server";
import * as schema from "./schema";

export const database = drizzle(pgPool, { schema });
