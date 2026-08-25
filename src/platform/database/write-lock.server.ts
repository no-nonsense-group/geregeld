import "@tanstack/react-start/server-only";

import { type SQL, sql } from "drizzle-orm";

import { isSqlite } from "./schema";

type LockExecutor = {
  execute: (query: SQL) => Promise<unknown>;
};

export async function acquireOrganizationLock(
  executor: LockExecutor,
  organizationId: string,
): Promise<void> {
  if (isSqlite) {
    // better-sqlite3/libsql transactions serialize writes, so no advisory lock is needed
    return;
  }

  await executor.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${organizationId}, 0))`,
  );
}

export function withRowLock<T extends { for: (strength: "update") => unknown }>(
  builder: T,
): ReturnType<T["for"]> {
  if (isSqlite) {
    // SQLite transactions lock the entire database, so row-level locks are unnecessary
    return builder as unknown as ReturnType<T["for"]>;
  }

  return builder.for("update") as ReturnType<T["for"]>;
}
