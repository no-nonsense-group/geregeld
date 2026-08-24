import "@tanstack/react-start/server-only";

import { isAPIError } from "better-auth/api";
import { Effect, Layer, Schema } from "effect";

import {
  EmailAlreadyRegistered,
  InvalidRegistrationCode,
  RegistrationCodeAttemptsExceeded,
  RegistrationCodeExpired,
  RegistrationUnavailable,
  User,
} from "#/contexts/identity/slices/register/contract";
import { RegistrationGateway } from "#/contexts/identity/slices/register/gateway";
import { auth } from "#/platform/auth/auth.server";
import { registrationErrorCodes } from "#/platform/auth/registration-plugin.server";

function errorCode(error: unknown): string | undefined {
  if (!isAPIError(error)) {
    return undefined;
  }

  return typeof error.body?.code === "string" ? error.body.code : undefined;
}

function mapCompletionError(error: unknown) {
  switch (errorCode(error)) {
    case registrationErrorCodes.invalidCode:
      return new InvalidRegistrationCode();
    case registrationErrorCodes.expiredCode:
      return new RegistrationCodeExpired();
    case registrationErrorCodes.attemptsExceeded:
      return new RegistrationCodeAttemptsExceeded();
    case registrationErrorCodes.alreadyRegistered:
      return new EmailAlreadyRegistered();
    default:
      return new RegistrationUnavailable();
  }
}

export const BetterAuthRegistrationLive = Layer.succeed(RegistrationGateway, {
  requestCode: (email) =>
    Effect.tryPromise({
      try: () =>
        auth.api.requestRegistrationCode({
          body: { email },
        }),
      catch: () => new RegistrationUnavailable(),
    }).pipe(Effect.asVoid),
  completeRegistration: (email, code) =>
    Effect.tryPromise({
      try: () =>
        auth.api.completeRegistration({
          body: { email, code },
        }),
      catch: mapCompletionError,
    }).pipe(
      Effect.flatMap((result) => Schema.decodeUnknown(User)(result.user)),
      Effect.mapError((error) =>
        error instanceof InvalidRegistrationCode ||
        error instanceof RegistrationCodeExpired ||
        error instanceof RegistrationCodeAttemptsExceeded ||
        error instanceof EmailAlreadyRegistered
          ? error
          : new RegistrationUnavailable(),
      ),
    ),
});
