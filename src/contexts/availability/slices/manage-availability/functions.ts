import { createServerFn } from "@tanstack/react-start";
import { Effect, Option } from "effect";

import {
  AuthenticationUnavailable,
  Unauthenticated,
} from "#/contexts/identity/slices/current-user/contract";
import type { CurrentUserGateway } from "#/contexts/identity/slices/current-user/gateway";
import { resolveCurrentUser } from "#/contexts/identity/slices/current-user/workflow";
import { OrganizationUnavailable } from "#/contexts/organizations/slices/setup-organization/contract";
import type { SetupOrganizationGateway } from "#/contexts/organizations/slices/setup-organization/gateway";
import { findOrganizationForUser } from "#/contexts/organizations/slices/setup-organization/workflow";
import { getIdentitySessionToken } from "#/platform/auth/session.server";
import { appRuntime } from "#/platform/runtime/app-runtime.server";
import {
  AvailabilityNotFound,
  AvailabilityUnavailable,
  InvalidAvailabilityInput,
} from "./contract";
import type { AvailabilityGateway } from "./gateway";
import {
  deleteBookingHoursDateException,
  getAvailabilityOverview,
  replaceWeeklyBookingHours,
  upsertBookingHoursDateException,
} from "./workflow";

type AvailabilityActionError =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "UNAVAILABLE";

function toActionError(error: unknown): AvailabilityActionError {
  if (error instanceof Unauthenticated) {
    return "UNAUTHENTICATED";
  }
  if (error instanceof InvalidAvailabilityInput) {
    return "INVALID_INPUT";
  }
  if (error instanceof AvailabilityNotFound) {
    return "NOT_FOUND";
  }
  if (
    error instanceof AuthenticationUnavailable ||
    error instanceof OrganizationUnavailable ||
    error instanceof AvailabilityUnavailable
  ) {
    return "UNAVAILABLE";
  }

  return "UNAVAILABLE";
}

function currentOrganization() {
  return resolveCurrentUser(getIdentitySessionToken()).pipe(
    Effect.flatMap((user) => findOrganizationForUser(user.id)),
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.fail(new OrganizationUnavailable()),
        onSome: Effect.succeed,
      }),
    ),
  );
}

function runAction<A>(
  effect: Effect.Effect<
    A,
    unknown,
    AvailabilityGateway | CurrentUserGateway | SetupOrganizationGateway
  >,
) {
  return appRuntime.runPromise(
    effect.pipe(
      Effect.match({
        onFailure: (error) => ({
          ok: false as const,
          error: toActionError(error),
        }),
        onSuccess: (value) => ({ ok: true as const, value }),
      }),
    ),
  );
}

export const getAvailabilityFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    runAction(
      currentOrganization().pipe(
        Effect.flatMap((organization) =>
          getAvailabilityOverview(organization.id, organization.timeZone, data),
        ),
      ),
    ),
  );

export const replaceWeeklyBookingHoursFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    runAction(
      currentOrganization().pipe(
        Effect.flatMap((organization) =>
          replaceWeeklyBookingHours(organization.id, data),
        ),
      ),
    ),
  );

export const upsertBookingHoursDateExceptionFn = createServerFn({
  method: "POST",
})
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    runAction(
      currentOrganization().pipe(
        Effect.flatMap((organization) =>
          upsertBookingHoursDateException(
            organization.id,
            organization.timeZone,
            data,
          ),
        ),
      ),
    ),
  );

export const deleteBookingHoursDateExceptionFn = createServerFn({
  method: "POST",
})
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    runAction(
      currentOrganization().pipe(
        Effect.flatMap((organization) =>
          deleteBookingHoursDateException(organization.id, data),
        ),
      ),
    ),
  );
