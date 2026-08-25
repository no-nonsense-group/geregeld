import "@tanstack/react-start/server-only";

import { Layer, ManagedRuntime } from "effect";

import { PostgresRegistrationLive } from "#/contexts/identity/infrastructure/postgres-registration.server";

const AppLayer = Layer.mergeAll(PostgresRegistrationLive);

export const appRuntime = ManagedRuntime.make(AppLayer);
