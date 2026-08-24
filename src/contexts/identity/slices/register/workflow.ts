import { Effect, Schema } from "effect";

import {
  CompleteRegistrationInput,
  InvalidRegistrationInput,
  RequestRegistrationCodeInput,
} from "./contract";
import { RegistrationGateway } from "./gateway";

const decodeRequest = Schema.decodeUnknown(RequestRegistrationCodeInput);
const decodeCompletion = Schema.decodeUnknown(CompleteRegistrationInput);

export function requestRegistrationCode(input: unknown) {
  return Effect.gen(function* () {
    const { email } = yield* decodeRequest(input).pipe(
      Effect.mapError(() => new InvalidRegistrationInput()),
    );
    const gateway = yield* RegistrationGateway;

    yield* gateway.requestCode(email);
  }).pipe(Effect.withSpan("identity.requestRegistrationCode"));
}

export function completeRegistration(input: unknown) {
  return Effect.gen(function* () {
    const { email, code } = yield* decodeCompletion(input).pipe(
      Effect.mapError(() => new InvalidRegistrationInput()),
    );
    const gateway = yield* RegistrationGateway;

    return yield* gateway.completeRegistration(email, code);
  }).pipe(Effect.withSpan("identity.completeRegistration"));
}
