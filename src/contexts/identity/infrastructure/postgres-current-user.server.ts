import "@tanstack/react-start/server-only";

import { and, eq, gt } from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  AuthenticationUnavailable,
  Unauthenticated,
} from "#/contexts/identity/slices/current-user/contract";
import { CurrentUserGateway } from "#/contexts/identity/slices/current-user/gateway";
import {
  EmailAddress,
  UserId,
} from "#/contexts/identity/slices/register/contract";
import { identitySessionTokenHash } from "#/platform/auth/session.server";
import { database } from "#/platform/database/drizzle.server";
import { identity_session, identity_user } from "#/platform/database/schema";

export const PostgresCurrentUserLive = Layer.succeed(CurrentUserGateway, {
  findBySessionToken: (token) =>
    Effect.tryPromise({
      try: async () => {
        const [record] = await database
          .select({
            id: identity_user.id,
            email: identity_user.email,
          })
          .from(identity_session)
          .innerJoin(
            identity_user,
            eq(identity_session.userId, identity_user.id),
          )
          .where(
            and(
              eq(identity_session.tokenHash, identitySessionTokenHash(token)),
              gt(identity_session.expiresAt, new Date()),
            ),
          )
          .limit(1);

        if (!record) {
          throw new Unauthenticated();
        }

        return {
          id: UserId.make(record.id),
          email: EmailAddress.make(record.email),
        };
      },
      catch: (error) =>
        error instanceof Unauthenticated
          ? error
          : new AuthenticationUnavailable(),
    }),
  endSession: (token) =>
    Effect.tryPromise({
      try: async () => {
        await database
          .delete(identity_session)
          .where(
            eq(identity_session.tokenHash, identitySessionTokenHash(token)),
          );
      },
      catch: () => new AuthenticationUnavailable(),
    }),
});
