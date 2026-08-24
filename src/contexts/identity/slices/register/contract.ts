import { Schema } from "effect";

const NormalizedEmailString = Schema.transform(Schema.String, Schema.String, {
  decode: (value) => value.trim().toLowerCase(),
  encode: (value) => value,
});

export const EmailAddress = NormalizedEmailString.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  Schema.brand("EmailAddress"),
);
export type EmailAddress = typeof EmailAddress.Type;

export const RegistrationCode = Schema.String.pipe(
  Schema.pattern(/^\d{6}$/),
  Schema.brand("RegistrationCode"),
);
export type RegistrationCode = typeof RegistrationCode.Type;

export const UserId = Schema.NonEmptyTrimmedString.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const User = Schema.Struct({
  id: UserId,
  email: EmailAddress,
});
export type User = typeof User.Type;

export const RequestRegistrationCodeInput = Schema.Struct({
  email: EmailAddress,
});
export type RequestRegistrationCodeInput =
  typeof RequestRegistrationCodeInput.Type;

export const CompleteRegistrationInput = Schema.Struct({
  email: EmailAddress,
  code: RegistrationCode,
});
export type CompleteRegistrationInput = typeof CompleteRegistrationInput.Type;

export class InvalidRegistrationInput extends Schema.TaggedError<InvalidRegistrationInput>()(
  "InvalidRegistrationInput",
  {},
) {}

export class InvalidRegistrationCode extends Schema.TaggedError<InvalidRegistrationCode>()(
  "InvalidRegistrationCode",
  {},
) {}

export class RegistrationCodeExpired extends Schema.TaggedError<RegistrationCodeExpired>()(
  "RegistrationCodeExpired",
  {},
) {}

export class RegistrationCodeAttemptsExceeded extends Schema.TaggedError<RegistrationCodeAttemptsExceeded>()(
  "RegistrationCodeAttemptsExceeded",
  {},
) {}

export class EmailAlreadyRegistered extends Schema.TaggedError<EmailAlreadyRegistered>()(
  "EmailAlreadyRegistered",
  {},
) {}

export class RegistrationUnavailable extends Schema.TaggedError<RegistrationUnavailable>()(
  "RegistrationUnavailable",
  {},
) {}

export type RequestRegistrationCodeError =
  | InvalidRegistrationInput
  | RegistrationUnavailable;

export type CompleteRegistrationError =
  | InvalidRegistrationInput
  | InvalidRegistrationCode
  | RegistrationCodeExpired
  | RegistrationCodeAttemptsExceeded
  | EmailAlreadyRegistered
  | RegistrationUnavailable;
