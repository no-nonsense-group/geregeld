import { createServerFn } from "@tanstack/react-start";
import { Effect, Option } from "effect";
import { resolveCurrentUser } from "#/contexts/identity/slices/current-user/workflow";
import { OrganizationUnavailable } from "#/contexts/organizations/slices/setup-organization/contract";
import { findOrganizationForUser } from "#/contexts/organizations/slices/setup-organization/workflow";
import { getIdentitySessionToken } from "#/platform/auth/session.server";
import { appRuntime } from "#/platform/runtime/app-runtime.server";
import { InvalidBookingChange } from "./contract";
import { BookingSetupGateway } from "./gateway";
import { saveBookingSetup } from "./workflow";

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
export const getBookingSetupFn = createServerFn({ method: "GET" }).handler(() =>
  appRuntime.runPromise(
    currentOrganization().pipe(
      Effect.flatMap((org) =>
        Effect.flatMap(BookingSetupGateway, (gateway) => gateway.get(org.id)),
      ),
      Effect.match({
        onFailure: () => ({ ok: false as const }),
        onSuccess: (value) => ({ ok: true as const, value }),
      }),
    ),
  ),
);
export const saveBookingSetupFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    appRuntime.runPromise(
      currentOrganization().pipe(
        Effect.flatMap((org) => saveBookingSetup(org.id, data)),
        Effect.match({
          onFailure: (error) => ({
            ok: false as const,
            error:
              error instanceof InvalidBookingChange
                ? "INVALID_INPUT"
                : "UNAVAILABLE",
          }),
          onSuccess: () => ({ ok: true as const }),
        }),
      ),
    ),
  );
