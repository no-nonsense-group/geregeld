import { expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";

import { EmailAddress, type User, UserId } from "../register/contract";
import { EmailNotRegistered, InvalidLoginCode, LoginCode } from "./contract";
import { LoginGateway, type LoginGatewayService } from "./gateway";
import { completeLogin, requestLoginCode } from "./workflow";

const email = Schema.decodeSync(EmailAddress)("owner@example.com");
const code = Schema.decodeSync(LoginCode)("123456");
const user = {
  id: UserId.make("user-1"),
  email,
} satisfies User;

function makeGateway(options?: {
  readonly registered?: boolean;
  readonly invalidCode?: boolean;
}) {
  const calls: Array<string> = [];

  const service: LoginGatewayService = {
    requestCode: () =>
      Effect.gen(function* () {
        calls.push("request-code");

        if (options?.registered === false) {
          return yield* new EmailNotRegistered();
        }
      }),
    completeLogin: () =>
      Effect.gen(function* () {
        calls.push("complete-login");

        if (options?.registered === false) {
          return yield* new EmailNotRegistered();
        }

        if (options?.invalidCode) {
          return yield* new InvalidLoginCode();
        }

        return user;
      }),
  };

  return {
    calls,
    layer: Layer.succeed(LoginGateway, service),
  };
}

it.effect("requests a code for a registered email", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* requestLoginCode({ email });
    expect(gateway.calls).toEqual(["request-code"]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("rejects an email without a User", () => {
  const gateway = makeGateway({ registered: false });

  return Effect.gen(function* () {
    const error = yield* Effect.flip(requestLoginCode({ email }));
    expect(error).toBeInstanceOf(EmailNotRegistered);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("a valid code creates a session for the User", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* completeLogin({ email, code });
    expect(result).toEqual(user);
    expect(gateway.calls).toEqual(["complete-login"]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("an invalid code does not authenticate the User", () => {
  const gateway = makeGateway({ invalidCode: true });

  return Effect.gen(function* () {
    const error = yield* Effect.flip(completeLogin({ email, code }));
    expect(error).toBeInstanceOf(InvalidLoginCode);
  }).pipe(Effect.provide(gateway.layer));
});
