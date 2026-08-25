import { Schema } from "effect";

import { EmailAddress } from "../register/contract";

export const LoginCode = Schema.String.pipe(
  Schema.pattern(/^\d{6}$/),
  Schema.brand("LoginCode"),
);
export type LoginCode = typeof LoginCode.Type;

export const RequestLoginCodeInput = Schema.Struct({
  email: EmailAddress,
});

export const CompleteLoginInput = Schema.Struct({
  email: EmailAddress,
  code: LoginCode,
});

export class InvalidLoginInput extends Schema.TaggedError<InvalidLoginInput>()(
  "InvalidLoginInput",
  {},
) {}

export class InvalidLoginCode extends Schema.TaggedError<InvalidLoginCode>()(
  "InvalidLoginCode",
  {},
) {}

export class LoginCodeExpired extends Schema.TaggedError<LoginCodeExpired>()(
  "LoginCodeExpired",
  {},
) {}

export class LoginCodeAttemptsExceeded extends Schema.TaggedError<LoginCodeAttemptsExceeded>()(
  "LoginCodeAttemptsExceeded",
  {},
) {}

export class EmailNotRegistered extends Schema.TaggedError<EmailNotRegistered>()(
  "EmailNotRegistered",
  {},
) {}

export class LoginUnavailable extends Schema.TaggedError<LoginUnavailable>()(
  "LoginUnavailable",
  {},
) {}
