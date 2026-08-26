import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import {
  AuthenticationUnavailable,
  Unauthenticated,
} from "#/contexts/identity/slices/current-user/contract";
import { resolveCurrentUser } from "#/contexts/identity/slices/current-user/workflow";
import {
  clearIdentitySessionCookie,
  getIdentitySessionToken,
} from "#/platform/auth/session.server";
import { appRuntime } from "#/platform/runtime/app-runtime.server";
import {
  InvalidUpdateOrganizationInput,
  OrganizationManagementUnavailable,
} from "./contract";
import { deleteOrganizationAndUser, updateOrganization } from "./workflow";

export const updateOrganizationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    appRuntime.runPromise(
      resolveCurrentUser(getIdentitySessionToken()).pipe(
        Effect.flatMap((user) => updateOrganization(user.id, data)),
        Effect.match({
          onFailure: (error) => {
            if (error instanceof Unauthenticated) {
              return { ok: false as const, error: "UNAUTHENTICATED" as const };
            }

            if (error instanceof InvalidUpdateOrganizationInput) {
              return { ok: false as const, error: "INVALID_INPUT" as const };
            }

            if (
              error instanceof AuthenticationUnavailable ||
              error instanceof OrganizationManagementUnavailable
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

export const deleteOrganizationFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const result = await appRuntime.runPromise(
      resolveCurrentUser(getIdentitySessionToken()).pipe(
        Effect.flatMap((user) => deleteOrganizationAndUser(user.id)),
        Effect.match({
          onFailure: (error) => ({
            ok: false as const,
            error:
              error instanceof Unauthenticated
                ? ("UNAUTHENTICATED" as const)
                : ("UNAVAILABLE" as const),
          }),
          onSuccess: () => ({ ok: true as const }),
        }),
      ),
    );

    if (result.ok) {
      clearIdentitySessionCookie();
    }

    return result;
  },
);
