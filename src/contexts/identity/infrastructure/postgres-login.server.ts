import "@tanstack/react-start/server-only";

import {
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  EmailNotRegistered,
  InvalidLoginCode,
  LoginCodeAttemptsExceeded,
  LoginCodeExpired,
  LoginUnavailable,
} from "#/contexts/identity/slices/login/contract";
import { LoginGateway } from "#/contexts/identity/slices/login/gateway";
import {
  type User,
  UserId,
} from "#/contexts/identity/slices/register/contract";
import {
  identitySessionExpiresAt,
  identitySessionTokenHash,
  setIdentitySessionCookie,
} from "#/platform/auth/session.server";
import { database } from "#/platform/database/drizzle.server";
import {
  identity_login_challenge,
  identity_session,
  identity_user,
} from "#/platform/database/schema";
import { sendLoginEmail } from "#/platform/email/resend-login-email.server";

const loginCodeLifetimeMs = 5 * 60 * 1000;
const allowedAttempts = 3;

type CompletionError =
  | InvalidLoginCode
  | LoginCodeExpired
  | LoginCodeAttemptsExceeded
  | EmailNotRegistered
  | LoginUnavailable;

function loginCodeSecret(): string {
  const secret = process.env.REGISTRATION_CODE_SECRET?.trim();

  if (secret) {
    if (secret.length < 32) {
      throw new Error(
        "REGISTRATION_CODE_SECRET must contain at least 32 characters",
      );
    }

    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("REGISTRATION_CODE_SECRET is required in production");
  }

  return "geregeld-development-registration-code-secret";
}

function hashLoginCode(email: string, code: string): string {
  return createHmac("sha256", loginCodeSecret())
    .update(`login:${email}:${code}`)
    .digest("hex");
}

function hashesMatch(expected: string, actual: string): boolean {
  const expectedBytes = Buffer.from(expected, "hex");
  const actualBytes = Buffer.from(actual, "hex");

  return (
    expectedBytes.length === actualBytes.length &&
    timingSafeEqual(expectedBytes, actualBytes)
  );
}

function isCompletionError(error: unknown): error is CompletionError {
  return (
    error instanceof InvalidLoginCode ||
    error instanceof LoginCodeExpired ||
    error instanceof LoginCodeAttemptsExceeded ||
    error instanceof EmailNotRegistered ||
    error instanceof LoginUnavailable
  );
}

function mapCompletionError(error: unknown): CompletionError {
  return isCompletionError(error) ? error : new LoginUnavailable();
}

async function deliverLoginCode(input: {
  readonly challengeId: string;
  readonly email: string;
  readonly code: string;
}): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const { storeDevelopmentLoginCode } = await import(
      "#/platform/auth/development-login-inbox.server"
    );
    storeDevelopmentLoginCode(input.email, input.code);
    return;
  }

  await sendLoginEmail(input);
}

export const PostgresLoginLive = Layer.succeed(LoginGateway, {
  requestCode: (email) =>
    Effect.tryPromise({
      try: async () => {
        const user = await database.query.identity_user.findFirst({
          where: eq(identity_user.email, email),
          columns: { id: true },
        });

        if (!user) {
          throw new EmailNotRegistered();
        }

        const challengeId = randomUUID();
        const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
        const codeHash = hashLoginCode(email, code);
        const expiresAt = new Date(Date.now() + loginCodeLifetimeMs);

        await database
          .insert(identity_login_challenge)
          .values({
            id: challengeId,
            email,
            codeHash,
            attempts: 0,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: identity_login_challenge.email,
            set: {
              id: challengeId,
              codeHash,
              attempts: 0,
              expiresAt,
              createdAt: new Date(),
            },
          });

        try {
          await deliverLoginCode({ challengeId, email, code });
        } catch (error) {
          console.error("Login code delivery failed", error);
          await database
            .delete(identity_login_challenge)
            .where(
              and(
                eq(identity_login_challenge.id, challengeId),
                eq(identity_login_challenge.codeHash, codeHash),
              ),
            );
          throw error;
        }
      },
      catch: (error) =>
        error instanceof EmailNotRegistered ? error : new LoginUnavailable(),
    }).pipe(Effect.asVoid),
  completeLogin: (email, code) =>
    Effect.tryPromise({
      try: async () => {
        const result = await database.transaction(async (transaction) => {
          const [challenge] = await transaction
            .select()
            .from(identity_login_challenge)
            .where(eq(identity_login_challenge.email, email))
            .for("update")
            .limit(1);

          if (!challenge) {
            return { kind: "invalid-code" as const };
          }

          if (challenge.expiresAt.getTime() < Date.now()) {
            await transaction
              .delete(identity_login_challenge)
              .where(eq(identity_login_challenge.id, challenge.id));
            return { kind: "expired-code" as const };
          }

          if (challenge.attempts >= allowedAttempts) {
            await transaction
              .delete(identity_login_challenge)
              .where(eq(identity_login_challenge.id, challenge.id));
            return { kind: "attempts-exceeded" as const };
          }

          const suppliedHash = hashLoginCode(email, code);

          if (!hashesMatch(challenge.codeHash, suppliedHash)) {
            await transaction
              .update(identity_login_challenge)
              .set({ attempts: challenge.attempts + 1 })
              .where(eq(identity_login_challenge.id, challenge.id));
            return { kind: "invalid-code" as const };
          }

          await transaction
            .delete(identity_login_challenge)
            .where(eq(identity_login_challenge.id, challenge.id));

          const user = await transaction.query.identity_user.findFirst({
            where: eq(identity_user.email, email),
          });

          if (!user) {
            return { kind: "not-registered" as const };
          }

          const sessionToken = randomBytes(32).toString("base64url");

          await transaction.insert(identity_session).values({
            expiresAt: identitySessionExpiresAt(),
            tokenHash: identitySessionTokenHash(sessionToken),
            userId: user.id,
          });

          return { kind: "success" as const, sessionToken, user };
        });

        switch (result.kind) {
          case "invalid-code":
            throw new InvalidLoginCode();
          case "expired-code":
            throw new LoginCodeExpired();
          case "attempts-exceeded":
            throw new LoginCodeAttemptsExceeded();
          case "not-registered":
            throw new EmailNotRegistered();
        }

        setIdentitySessionCookie(result.sessionToken);

        return {
          id: UserId.make(result.user.id),
          email,
        } satisfies User;
      },
      catch: mapCompletionError,
    }),
});
