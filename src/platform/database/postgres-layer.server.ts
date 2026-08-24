import "@tanstack/react-start/server-only";

import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import type { PgRemoteDatabase } from "drizzle-orm/pg-proxy";
import { Config, Context, Layer } from "effect";

import * as schema from "./schema";

export const PostgresLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
  maxConnections: Config.integer("DATABASE_MAX_CONNECTIONS").pipe(
    Config.withDefault(4),
  ),
});

export class EffectDrizzle extends Context.Tag("EffectDrizzle")<
  EffectDrizzle,
  PgRemoteDatabase<typeof schema>
>() {}

const EffectDrizzleLive = Layer.effect(
  EffectDrizzle,
  PgDrizzle.make({ schema }),
);

export const DrizzleLive = EffectDrizzleLive.pipe(
  Layer.provideMerge(PostgresLive),
);
