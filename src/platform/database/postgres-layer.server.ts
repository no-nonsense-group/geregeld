import "@tanstack/react-start/server-only";

import { PgClient } from "@effect/sql-pg";
import { Config } from "effect";

export const PostgresLive = PgClient.layerConfig({
	url: Config.redacted("DATABASE_URL"),
	maxConnections: Config.integer("DATABASE_MAX_CONNECTIONS").pipe(
		Config.withDefault(4),
	),
});
