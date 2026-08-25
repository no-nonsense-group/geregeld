import { expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";

import { EmailAddress, UserId } from "../register/contract";
import { Unauthenticated } from "./contract";
import { CurrentUserGateway, type CurrentUserGatewayService } from "./gateway";
import { endCurrentSession, resolveCurrentUser } from "./workflow";

const user = {
  id: UserId.make("user-1"),
  email: Schema.decodeSync(EmailAddress)("owner@example.com"),
};

const gateway: CurrentUserGatewayService = {
  findBySessionToken: () => Effect.succeed(user),
  endSession: () => Effect.void,
};

const layer = Layer.succeed(CurrentUserGateway, gateway);

it.effect("rejects a request without a session token", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(resolveCurrentUser(undefined));
    expect(error).toBeInstanceOf(Unauthenticated);
  }).pipe(Effect.provide(layer)),
);

it.effect("resolves the User represented by the session token", () =>
  Effect.gen(function* () {
    const result = yield* resolveCurrentUser("session-token");
    expect(result).toEqual(user);
  }).pipe(Effect.provide(layer)),
);

it.effect("ends an existing session", () =>
  Effect.gen(function* () {
    let endedToken: string | undefined;
    const recordingLayer = Layer.succeed(CurrentUserGateway, {
      ...gateway,
      endSession: (token: string) => {
        endedToken = token;
        return Effect.void;
      },
    });

    yield* endCurrentSession("session-token").pipe(
      Effect.provide(recordingLayer),
    );
    expect(endedToken).toBe("session-token");
  }),
);

it.effect("does nothing when there is no session to end", () =>
  endCurrentSession(undefined).pipe(Effect.provide(layer)),
);
