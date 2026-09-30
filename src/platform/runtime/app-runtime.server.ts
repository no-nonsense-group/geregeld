import "@tanstack/react-start/server-only";

import { Layer, ManagedRuntime } from "effect";

import { PostgresManageAvailabilityLive } from "#/contexts/availability/infrastructure/postgres-manage-availability.server";
import { PostgresBookingSetupLive } from "#/contexts/booking/infrastructure/postgres-booking-setup.server";
import { PostgresCurrentUserLive } from "#/contexts/identity/infrastructure/postgres-current-user.server";
import { PostgresLoginLive } from "#/contexts/identity/infrastructure/postgres-login.server";
import { PostgresRegistrationLive } from "#/contexts/identity/infrastructure/postgres-registration.server";
import { PostgresSetupOrganizationLive } from "#/contexts/organizations/infrastructure/postgres-setup-organization.server";

const AppLayer = Layer.mergeAll(
  PostgresRegistrationLive,
  PostgresLoginLive,
  PostgresCurrentUserLive,
  PostgresSetupOrganizationLive,
  PostgresManageAvailabilityLive,
  PostgresBookingSetupLive,
);

export const appRuntime = ManagedRuntime.make(AppLayer);
