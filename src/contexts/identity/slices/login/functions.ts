import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { appRuntime } from "#/platform/runtime/app-runtime.server";
import {
  EmailNotRegistered,
  InvalidLoginCode,
  InvalidLoginInput,
  LoginCodeAttemptsExceeded,
  LoginCodeExpired,
} from "./contract";
import { completeLogin, requestLoginCode } from "./workflow";

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

export const requestLoginCodeFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    const result = await appRuntime.runPromise(
      requestLoginCode(data).pipe(
        Effect.match({
          onFailure: (error) => {
            if (error instanceof InvalidLoginInput) {
              return { ok: false as const, error: "INVALID_INPUT" as const };
            }
            if (error instanceof EmailNotRegistered) {
              return { ok: false as const, error: "NOT_REGISTERED" as const };
            }

            return { ok: false as const, error: "UNAVAILABLE" as const };
          },
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

    const { getDevelopmentLoginCode } = await import(
      "#/platform/auth/development-login-inbox.server"
    );

    return {
      ...result,
      developmentCode: getDevelopmentLoginCode(email),
    };
  });

export const completeLoginFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(({ data }) =>
    appRuntime.runPromise(
      completeLogin(data).pipe(
        Effect.match({
          onFailure: (error) => {
            if (error instanceof InvalidLoginInput) {
              return { ok: false as const, error: "INVALID_INPUT" as const };
            }
            if (error instanceof InvalidLoginCode) {
              return { ok: false as const, error: "INVALID_CODE" as const };
            }
            if (error instanceof LoginCodeExpired) {
              return { ok: false as const, error: "EXPIRED_CODE" as const };
            }
            if (error instanceof LoginCodeAttemptsExceeded) {
              return {
                ok: false as const,
                error: "ATTEMPTS_EXCEEDED" as const,
              };
            }
            if (error instanceof EmailNotRegistered) {
              return { ok: false as const, error: "NOT_REGISTERED" as const };
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
