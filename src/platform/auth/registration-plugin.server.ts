import "@tanstack/react-start/server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import * as z from "zod";

const codeLifetimeMs = 5 * 60 * 1000;
const allowedAttempts = 3;

export const registrationErrorCodes = {
  invalidCode: "INVALID_REGISTRATION_CODE",
  expiredCode: "REGISTRATION_CODE_EXPIRED",
  attemptsExceeded: "REGISTRATION_CODE_ATTEMPTS_EXCEEDED",
  alreadyRegistered: "EMAIL_ALREADY_REGISTERED",
  unavailable: "REGISTRATION_UNAVAILABLE",
} as const;

interface RegistrationPluginOptions {
  readonly secret: string;
  readonly sendCode: (input: {
    readonly email: string;
    readonly code: string;
  }) => Promise<void>;
}

const registrationBody = z.object({
  email: z.email(),
});

const completionBody = registrationBody.extend({
  code: z.string().regex(/^\d{6}$/),
});

function identifier(email: string): string {
  return `registration:${email}`;
}

function hashCode(secret: string, email: string, code: string): string {
  return createHmac("sha256", secret)
    .update(`${identifier(email)}:${code}`)
    .digest("hex");
}

function codesMatch(expected: string, actual: string): boolean {
  const expectedBytes = Buffer.from(expected, "hex");
  const actualBytes = Buffer.from(actual, "hex");

  return (
    expectedBytes.length === actualBytes.length &&
    timingSafeEqual(expectedBytes, actualBytes)
  );
}

function registrationError(
  status: "BAD_REQUEST" | "CONFLICT" | "FORBIDDEN" | "INTERNAL_SERVER_ERROR",
  code: (typeof registrationErrorCodes)[keyof typeof registrationErrorCodes],
): APIError {
  return APIError.from(status, { code, message: code });
}

export function registrationPlugin(options: RegistrationPluginOptions) {
  return {
    id: "geregeld-registration",
    endpoints: {
      requestRegistrationCode: createAuthEndpoint(
        "/geregeld-registration/request-code",
        {
          method: "POST",
          body: registrationBody,
        },
        async (ctx) => {
          const email = ctx.body.email.trim().toLowerCase();
          const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
          const challengeIdentifier = identifier(email);

          await ctx.context.internalAdapter.deleteVerificationByIdentifier(
            challengeIdentifier,
          );
          await ctx.context.internalAdapter.createVerificationValue({
            identifier: challengeIdentifier,
            value: `${hashCode(options.secret, email, code)}:0`,
            expiresAt: new Date(Date.now() + codeLifetimeMs),
          });

          try {
            await options.sendCode({ email, code });
          } catch {
            await ctx.context.internalAdapter.deleteVerificationByIdentifier(
              challengeIdentifier,
            );
            throw registrationError(
              "INTERNAL_SERVER_ERROR",
              registrationErrorCodes.unavailable,
            );
          }

          return ctx.json({ success: true });
        },
      ),
      completeRegistration: createAuthEndpoint(
        "/geregeld-registration/complete",
        {
          method: "POST",
          body: completionBody,
        },
        async (ctx) => {
          const email = ctx.body.email.trim().toLowerCase();
          const challengeIdentifier = identifier(email);
          const existingChallenge =
            await ctx.context.internalAdapter.findVerificationValue(
              challengeIdentifier,
            );

          if (
            existingChallenge &&
            existingChallenge.expiresAt.getTime() < Date.now()
          ) {
            await ctx.context.internalAdapter.deleteVerificationByIdentifier(
              challengeIdentifier,
            );
            throw registrationError(
              "BAD_REQUEST",
              registrationErrorCodes.expiredCode,
            );
          }

          const challenge =
            await ctx.context.internalAdapter.consumeVerificationValue(
              challengeIdentifier,
            );

          if (!challenge) {
            throw registrationError(
              "BAD_REQUEST",
              registrationErrorCodes.invalidCode,
            );
          }

          const separator = challenge.value.lastIndexOf(":");
          const storedHash = challenge.value.slice(0, separator);
          const attempts = Number(challenge.value.slice(separator + 1));

          if (attempts >= allowedAttempts) {
            throw registrationError(
              "FORBIDDEN",
              registrationErrorCodes.attemptsExceeded,
            );
          }

          const suppliedHash = hashCode(options.secret, email, ctx.body.code);

          if (!codesMatch(storedHash, suppliedHash)) {
            await ctx.context.internalAdapter.createVerificationValue({
              identifier: challengeIdentifier,
              value: `${storedHash}:${attempts + 1}`,
              expiresAt: challenge.expiresAt,
            });
            throw registrationError(
              "BAD_REQUEST",
              registrationErrorCodes.invalidCode,
            );
          }

          if (await ctx.context.internalAdapter.findUserByEmail(email)) {
            throw registrationError(
              "CONFLICT",
              registrationErrorCodes.alreadyRegistered,
            );
          }

          const user = await ctx.context.internalAdapter
            .createUser(
              {
                email,
                emailVerified: true,
                name: "",
              },
              { method: "geregeld-registration" },
            )
            .catch(async () => {
              if (await ctx.context.internalAdapter.findUserByEmail(email)) {
                throw registrationError(
                  "CONFLICT",
                  registrationErrorCodes.alreadyRegistered,
                );
              }
              throw registrationError(
                "INTERNAL_SERVER_ERROR",
                registrationErrorCodes.unavailable,
              );
            });

          const session = await ctx.context.internalAdapter
            .createSession(user.id)
            .catch(async () => {
              await ctx.context.internalAdapter.deleteUser(user.id);
              throw registrationError(
                "INTERNAL_SERVER_ERROR",
                registrationErrorCodes.unavailable,
              );
            });
          await setSessionCookie(ctx, { session, user });

          return ctx.json({
            user: {
              id: user.id,
              email: user.email,
            },
          });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
