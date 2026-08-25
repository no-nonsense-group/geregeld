import { Schema } from "effect";

const TrimmedString = Schema.transform(Schema.String, Schema.String, {
  decode: (value) => value.trim(),
  encode: (value) => value,
});

function isIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const OrganizationId = Schema.NonEmptyTrimmedString.pipe(
  Schema.brand("OrganizationId"),
);
export type OrganizationId = typeof OrganizationId.Type;

export const OrganizationName = TrimmedString.pipe(
  Schema.minLength(1),
  Schema.maxLength(100),
  Schema.brand("OrganizationName"),
);
export type OrganizationName = typeof OrganizationName.Type;

export const IanaTimeZone = TrimmedString.pipe(
  Schema.minLength(1),
  Schema.maxLength(100),
  Schema.filter(isIanaTimeZone),
  Schema.brand("IanaTimeZone"),
);
export type IanaTimeZone = typeof IanaTimeZone.Type;

export const Organization = Schema.Struct({
  id: OrganizationId,
  name: OrganizationName,
  timeZone: IanaTimeZone,
  defaultAvailabilityPeriodMinutes: Schema.Int.pipe(Schema.between(1, 1440)),
  availabilityConfiguredAt: Schema.NullOr(Schema.DateFromSelf),
});
export type Organization = typeof Organization.Type;

export const SetupOrganizationInput = Schema.Struct({
  name: OrganizationName,
  timeZone: IanaTimeZone,
  termsAccepted: Schema.Literal(true),
});
export type SetupOrganizationInput = typeof SetupOrganizationInput.Type;

export class InvalidSetupOrganizationInput extends Schema.TaggedError<InvalidSetupOrganizationInput>()(
  "InvalidSetupOrganizationInput",
  {},
) {}

export class OrganizationUnavailable extends Schema.TaggedError<OrganizationUnavailable>()(
  "OrganizationUnavailable",
  {},
) {}
