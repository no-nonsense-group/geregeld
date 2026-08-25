import { Effect, Schema } from "effect";

import {
  CompleteLoginInput,
  InvalidLoginInput,
  RequestLoginCodeInput,
} from "./contract";
import { LoginGateway } from "./gateway";

const decodeRequest = Schema.decodeUnknown(RequestLoginCodeInput);
const decodeCompletion = Schema.decodeUnknown(CompleteLoginInput);

export function requestLoginCode(input: unknown) {
  return Effect.gen(function* () {
    const { email } = yield* decodeRequest(input).pipe(
      Effect.mapError(() => new InvalidLoginInput()),
    );
    const gateway = yield* LoginGateway;

    yield* gateway.requestCode(email);
  }).pipe(Effect.withSpan("identity.requestLoginCode"));
}

export function completeLogin(input: unknown) {
  return Effect.gen(function* () {
    const { email, code } = yield* decodeCompletion(input).pipe(
      Effect.mapError(() => new InvalidLoginInput()),
    );
    const gateway = yield* LoginGateway;

    return yield* gateway.completeLogin(email, code);
  }).pipe(Effect.withSpan("identity.completeLogin"));
}
