import "@tanstack/react-start/server-only";

import { Layer, ManagedRuntime } from "effect";

import { PostgresCurrentUserLive } from "#/contexts/identity/infrastructure/postgres-current-user.server";
import { PostgresRegistrationLive } from "#/contexts/identity/infrastructure/postgres-registration.server";
import { PostgresSetupOrganizationLive } from "#/contexts/organizations/infrastructure/postgres-setup-organization.server";

const AppLayer = Layer.mergeAll(
  PostgresRegistrationLive,
  PostgresCurrentUserLive,
  PostgresSetupOrganizationLive,
);

export const appRuntime = ManagedRuntime.make(AppLayer);
