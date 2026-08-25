import { Context, type Effect } from "effect";

import type { EmailAddress, User } from "../register/contract";
import type {
  EmailNotRegistered,
  InvalidLoginCode,
  LoginCode,
  LoginCodeAttemptsExceeded,
  LoginCodeExpired,
  LoginUnavailable,
} from "./contract";

export interface LoginGatewayService {
  readonly requestCode: (
    email: EmailAddress,
  ) => Effect.Effect<void, EmailNotRegistered | LoginUnavailable>;
  readonly completeLogin: (
    email: EmailAddress,
    code: LoginCode,
  ) => Effect.Effect<
    User,
    | InvalidLoginCode
    | LoginCodeExpired
    | LoginCodeAttemptsExceeded
    | EmailNotRegistered
    | LoginUnavailable
  >;
}

export const LoginGateway = Context.GenericTag<LoginGatewayService>(
  "Identity/LoginGateway",
);
