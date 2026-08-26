import "@tanstack/react-start/server-only";

import { Layer, ManagedRuntime } from "effect";

import { PostgresManageAvailabilityLive } from "#/contexts/availability/infrastructure/postgres-manage-availability.server";
import { PostgresCurrentUserLive } from "#/contexts/identity/infrastructure/postgres-current-user.server";
import { PostgresLoginLive } from "#/contexts/identity/infrastructure/postgres-login.server";
import { PostgresRegistrationLive } from "#/contexts/identity/infrastructure/postgres-registration.server";
import { PostgresManageOrganizationLive } from "#/contexts/organizations/infrastructure/postgres-manage-organization.server";
import { PostgresSetupOrganizationLive } from "#/contexts/organizations/infrastructure/postgres-setup-organization.server";

const AppLayer = Layer.mergeAll(
  PostgresRegistrationLive,
  PostgresLoginLive,
  PostgresCurrentUserLive,
  PostgresManageOrganizationLive,
  PostgresSetupOrganizationLive,
  PostgresManageAvailabilityLive,
);

export const appRuntime = ManagedRuntime.make(AppLayer);
