import { Context, type Effect } from "effect";

import type {
  EmailAddress,
  EmailAlreadyRegistered,
  InvalidRegistrationCode,
  RegistrationCode,
  RegistrationCodeAttemptsExceeded,
  RegistrationCodeExpired,
  RegistrationUnavailable,
  User,
} from "./contract";

export interface RegistrationGatewayService {
  readonly requestCode: (
    email: EmailAddress,
  ) => Effect.Effect<void, RegistrationUnavailable>;
  readonly completeRegistration: (
    email: EmailAddress,
    code: RegistrationCode,
  ) => Effect.Effect<
    User,
    | InvalidRegistrationCode
    | RegistrationCodeExpired
    | RegistrationCodeAttemptsExceeded
    | EmailAlreadyRegistered
    | RegistrationUnavailable
  >;
}

export const RegistrationGateway =
  Context.GenericTag<RegistrationGatewayService>(
    "Identity/RegistrationGateway",
  );
