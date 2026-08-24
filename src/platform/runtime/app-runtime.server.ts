import "@tanstack/react-start/server-only";

import { Layer, ManagedRuntime } from "effect";

import { BetterAuthRegistrationLive } from "#/contexts/identity/infrastructure/better-auth-registration.server";

const AppLayer = Layer.mergeAll(BetterAuthRegistrationLive);

export const appRuntime = ManagedRuntime.make(AppLayer);
