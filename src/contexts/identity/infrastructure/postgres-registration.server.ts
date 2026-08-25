import "@tanstack/react-start/server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  EmailAlreadyRegistered,
  InvalidRegistrationCode,
  RegistrationCodeAttemptsExceeded,
  RegistrationCodeExpired,
  RegistrationUnavailable,
  type User,
  UserId,
} from "#/contexts/identity/slices/register/contract";
import { RegistrationGateway } from "#/contexts/identity/slices/register/gateway";
import {
  identitySessionExpiresAt,
  setIdentitySessionCookie,
} from "#/platform/auth/session.server";
import { database } from "#/platform/database/drizzle.server";
import {
  identity_registration_challenge,
  identity_session,
  identity_user,
} from "#/platform/database/schema";
import { sendRegistrationEmail } from "#/platform/email/resend-registration-email.server";

const registrationCodeLifetimeMs = 5 * 60 * 1000;
const allowedAttempts = 3;

type CompletionError =
  | InvalidRegistrationCode
  | RegistrationCodeExpired
  | RegistrationCodeAttemptsExceeded
  | EmailAlreadyRegistered
  | RegistrationUnavailable;

function registrationCodeSecret(): string {
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

function hashRegistrationCode(email: string, code: string): string {
  return createHmac("sha256", registrationCodeSecret())
    .update(`${email}:${code}`)
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

function sessionTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isCompletionError(error: unknown): error is CompletionError {
  return (
    error instanceof InvalidRegistrationCode ||
    error instanceof RegistrationCodeExpired ||
    error instanceof RegistrationCodeAttemptsExceeded ||
    error instanceof EmailAlreadyRegistered ||
    error instanceof RegistrationUnavailable
  );
}

function isUserEmailUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    error.constraint === "identity_user_email_unique"
  );
}

function mapCompletionError(error: unknown): CompletionError {
  if (isCompletionError(error)) {
    return error;
  }

  return isUserEmailUniqueViolation(error)
    ? new EmailAlreadyRegistered()
    : new RegistrationUnavailable();
}

async function deliverRegistrationCode(input: {
  readonly challengeId: string;
  readonly email: string;
  readonly code: string;
}): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const { storeDevelopmentRegistrationCode } = await import(
      "#/platform/auth/development-registration-inbox.server"
    );
    storeDevelopmentRegistrationCode(input.email, input.code);
    return;
  }

  await sendRegistrationEmail(input);
}

export const PostgresRegistrationLive = Layer.succeed(RegistrationGateway, {
  requestCode: (email) =>
    Effect.tryPromise({
      try: async () => {
        const challengeId = randomUUID();
        const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
        const codeHash = hashRegistrationCode(email, code);
        const expiresAt = new Date(Date.now() + registrationCodeLifetimeMs);

        await database
          .insert(identity_registration_challenge)
          .values({
            id: challengeId,
            email,
            codeHash,
            attempts: 0,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: identity_registration_challenge.email,
            set: {
              id: challengeId,
              codeHash,
              attempts: 0,
              expiresAt,
              createdAt: new Date(),
            },
          });

        try {
          await deliverRegistrationCode({ challengeId, email, code });
        } catch (error) {
          console.error("Registration code delivery failed", error);
          await database
            .delete(identity_registration_challenge)
            .where(
              and(
                eq(identity_registration_challenge.id, challengeId),
                eq(identity_registration_challenge.codeHash, codeHash),
              ),
            );
          throw error;
        }
      },
      catch: () => new RegistrationUnavailable(),
    }).pipe(Effect.asVoid),
  completeRegistration: (email, code) =>
    Effect.tryPromise({
      try: async () => {
        const result = await database.transaction(async (transaction) => {
          const [challenge] = await transaction
            .select()
            .from(identity_registration_challenge)
            .where(eq(identity_registration_challenge.email, email))
            .for("update")
            .limit(1);

          if (!challenge) {
            return { kind: "invalid-code" as const };
          }

          if (challenge.expiresAt.getTime() < Date.now()) {
            await transaction
              .delete(identity_registration_challenge)
              .where(eq(identity_registration_challenge.id, challenge.id));
            return { kind: "expired-code" as const };
          }

          if (challenge.attempts >= allowedAttempts) {
            await transaction
              .delete(identity_registration_challenge)
              .where(eq(identity_registration_challenge.id, challenge.id));
            return { kind: "attempts-exceeded" as const };
          }

          const suppliedHash = hashRegistrationCode(email, code);

          if (!hashesMatch(challenge.codeHash, suppliedHash)) {
            await transaction
              .update(identity_registration_challenge)
              .set({ attempts: challenge.attempts + 1 })
              .where(eq(identity_registration_challenge.id, challenge.id));
            return { kind: "invalid-code" as const };
          }

          await transaction
            .delete(identity_registration_challenge)
            .where(eq(identity_registration_challenge.id, challenge.id));

          if (
            await transaction.query.identity_user.findFirst({
              where: eq(identity_user.email, email),
              columns: { id: true },
            })
          ) {
            return { kind: "already-registered" as const };
          }

          const [user] = await transaction
            .insert(identity_user)
            .values({ email, emailVerified: true })
            .returning();

          if (!user) {
            throw new Error("PostgreSQL did not return the registered user");
          }

          const sessionToken = randomBytes(32).toString("base64url");

          await transaction.insert(identity_session).values({
            expiresAt: identitySessionExpiresAt(),
            tokenHash: sessionTokenHash(sessionToken),
            userId: user.id,
          });

          return { kind: "success" as const, sessionToken, user };
        });

        switch (result.kind) {
          case "invalid-code":
            throw new InvalidRegistrationCode();
          case "expired-code":
            throw new RegistrationCodeExpired();
          case "attempts-exceeded":
            throw new RegistrationCodeAttemptsExceeded();
          case "already-registered":
            throw new EmailAlreadyRegistered();
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
