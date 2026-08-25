import { createServerFn } from "@tanstack/react-start";
import { Effect, Option } from "effect";

import {
  AuthenticationUnavailable,
  Unauthenticated,
} from "#/contexts/identity/slices/current-user/contract";
import { resolveCurrentUser } from "#/contexts/identity/slices/current-user/workflow";
import { getIdentitySessionToken } from "#/platform/auth/session.server";
import { appRuntime } from "#/platform/runtime/app-runtime.server";
import {
  InvalidSetupOrganizationInput,
  OrganizationUnavailable,
} from "./contract";
import { findOrganizationForUser, setupOrganization } from "./workflow";

function organizationContext() {
  return resolveCurrentUser(getIdentitySessionToken()).pipe(
    Effect.flatMap((user) => findOrganizationForUser(user.id)),
  );
}

export const getOrganizationContextFn = createServerFn({
  method: "GET",
}).handler(() =>
  appRuntime.runPromise(
    organizationContext().pipe(
      Effect.match({
        onFailure: (error) => ({
          status:
            error instanceof Unauthenticated
              ? ("unauthenticated" as const)
              : ("unavailable" as const),
        }),
        onSuccess: (result) =>
          Option.match(result, {
            onNone: () => ({ status: "setup-required" as const }),
            onSome: (organization) => ({
              status: "ready" as const,
              organization,
            }),
          }),
      }),
    ),
  ),
);

export const setupOrganizationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    appRuntime.runPromise(
      resolveCurrentUser(getIdentitySessionToken()).pipe(
        Effect.flatMap((user) => setupOrganization(user.id, data)),
        Effect.match({
          onFailure: (error) => {
            if (error instanceof Unauthenticated) {
              return { ok: false as const, error: "UNAUTHENTICATED" as const };
            }

            if (error instanceof InvalidSetupOrganizationInput) {
              return { ok: false as const, error: "INVALID_INPUT" as const };
            }

            if (
              error instanceof AuthenticationUnavailable ||
              error instanceof OrganizationUnavailable
            ) {
              return { ok: false as const, error: "UNAVAILABLE" as const };
            }

            return { ok: false as const, error: "UNAVAILABLE" as const };
          },
          onSuccess: (organization) => ({
            ok: true as const,
            organization,
          }),
        }),
      ),
    ),
  );
