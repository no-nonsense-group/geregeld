import { expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";

import {
  EmailAddress,
  EmailAlreadyRegistered,
  InvalidRegistrationCode,
  RegistrationCode,
  type User,
  UserId,
} from "./contract";
import {
  RegistrationGateway,
  type RegistrationGatewayService,
} from "./gateway";
import { completeRegistration, requestRegistrationCode } from "./workflow";

const email = Schema.decodeSync(EmailAddress)("owner@example.com");
const code = Schema.decodeSync(RegistrationCode)("123456");

function makeGateway(options?: {
  readonly existingUser?: User;
  readonly invalidCode?: boolean;
}) {
  const calls: Array<string> = [];

  const service: RegistrationGatewayService = {
    requestCode: () =>
      Effect.sync(() => {
        calls.push("request-code");
      }),
    completeRegistration: (verifiedEmail) =>
      Effect.gen(function* () {
        calls.push("complete-registration");

        if (options?.invalidCode) {
          return yield* new InvalidRegistrationCode();
        }

        if (options?.existingUser) {
          return yield* new EmailAlreadyRegistered();
        }

        return {
          id: UserId.make("user-1"),
          email: verifiedEmail,
        } satisfies User;
      }),
  };

  return {
    calls,
    layer: Layer.succeed(RegistrationGateway, service),
  };
}

it.effect("requesting a code creates no User", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* requestRegistrationCode({ email });

    expect(gateway.calls).toEqual(["request-code"]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("a valid code creates a User and session", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const user = yield* completeRegistration({ email, code });

    expect(user).toEqual({
      id: "user-1",
      email,
    });
    expect(gateway.calls).toEqual(["complete-registration"]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("a verified duplicate returns EmailAlreadyRegistered", () => {
  const gateway = makeGateway({
    existingUser: {
      id: UserId.make("existing-user"),
      email,
    },
  });

  return Effect.gen(function* () {
    const error = yield* Effect.flip(completeRegistration({ email, code }));

    expect(error).toBeInstanceOf(EmailAlreadyRegistered);
    expect(gateway.calls).toEqual(["complete-registration"]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("an invalid code never looks up or creates a User", () => {
  const gateway = makeGateway({ invalidCode: true });

  return Effect.gen(function* () {
    const error = yield* Effect.flip(completeRegistration({ email, code }));

    expect(error).toBeInstanceOf(InvalidRegistrationCode);
    expect(gateway.calls).toEqual(["complete-registration"]);
  }).pipe(Effect.provide(gateway.layer));
});
