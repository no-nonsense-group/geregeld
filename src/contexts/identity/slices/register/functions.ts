import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { appRuntime } from "#/platform/runtime/app-runtime.server";
import {
  EmailAlreadyRegistered,
  InvalidRegistrationCode,
  InvalidRegistrationInput,
  RegistrationCodeAttemptsExceeded,
  RegistrationCodeExpired,
} from "./contract";
import { completeRegistration, requestRegistrationCode } from "./workflow";

function normalizedEmailFrom(input: unknown): string | undefined {
  if (
    typeof input !== "object" ||
    input === null ||
    !("email" in input) ||
    typeof input.email !== "string"
  ) {
    return undefined;
  }

  return input.email.trim().toLowerCase();
}

export const requestRegistrationCodeFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const result = await appRuntime.runPromise(
      requestRegistrationCode(data).pipe(
        Effect.match({
          onFailure: (error) => ({
            ok: false as const,
            error:
              error instanceof InvalidRegistrationInput
                ? ("INVALID_INPUT" as const)
                : ("UNAVAILABLE" as const),
          }),
          onSuccess: () => ({ ok: true as const }),
        }),
      ),
    );

    if (!result.ok || process.env.NODE_ENV === "production") {
      return result;
    }

    const email = normalizedEmailFrom(data);
    if (!email) {
      return result;
    }

    const { getDevelopmentRegistrationCode } = await import(
      "#/platform/auth/development-registration-inbox.server"
    );

    return {
      ...result,
      developmentCode: getDevelopmentRegistrationCode(email),
    };
  });

export const completeRegistrationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    appRuntime.runPromise(
      completeRegistration(data).pipe(
        Effect.match({
          onFailure: (error) => {
            if (error instanceof InvalidRegistrationInput) {
              return { ok: false as const, error: "INVALID_INPUT" as const };
            }
            if (error instanceof InvalidRegistrationCode) {
              return { ok: false as const, error: "INVALID_CODE" as const };
            }
            if (error instanceof RegistrationCodeExpired) {
              return { ok: false as const, error: "EXPIRED_CODE" as const };
            }
            if (error instanceof RegistrationCodeAttemptsExceeded) {
              return {
                ok: false as const,
                error: "ATTEMPTS_EXCEEDED" as const,
              };
            }
            if (error instanceof EmailAlreadyRegistered) {
              return {
                ok: false as const,
                error: "ALREADY_REGISTERED" as const,
              };
            }

            return { ok: false as const, error: "UNAVAILABLE" as const };
          },
          onSuccess: (user) => ({
            ok: true as const,
            user,
          }),
        }),
      ),
    ),
  );
