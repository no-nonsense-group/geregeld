import { Schema } from "effect";

export interface AvailabilityPeriod {
  readonly id: string;
  readonly date: string;
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface AvailabilityOverview {
  readonly configured: boolean;
  readonly defaultDurationMinutes: number;
  readonly localToday: string;
  readonly rangeFrom: string;
  readonly rangeTo: string;
  readonly totalFuturePeriods: number;
  readonly periods: ReadonlyArray<AvailabilityPeriod>;
}

export interface WeeklyRange {
  readonly dayOfWeek: number;
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface DatedAvailabilityPeriod {
  readonly date: string;
  readonly startMinute: number;
  readonly endMinute: number;
}

export class InvalidAvailabilityInput extends Schema.TaggedError<InvalidAvailabilityInput>()(
  "InvalidAvailabilityInput",
  {},
) {}

export class AvailabilityConflict extends Schema.TaggedError<AvailabilityConflict>()(
  "AvailabilityConflict",
  {},
) {}

export class AvailabilityNotFound extends Schema.TaggedError<AvailabilityNotFound>()(
  "AvailabilityNotFound",
  {},
) {}

export class AvailabilityBulkLimitExceeded extends Schema.TaggedError<AvailabilityBulkLimitExceeded>()(
  "AvailabilityBulkLimitExceeded",
  {},
) {}

export class AvailabilityUnavailable extends Schema.TaggedError<AvailabilityUnavailable>()(
  "AvailabilityUnavailable",
  {},
) {}
