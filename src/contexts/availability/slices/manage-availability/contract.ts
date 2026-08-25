import { Schema } from "effect";

export interface TimeWindow {
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface WeeklyBookingHoursWindow extends TimeWindow {
  readonly id?: string;
  readonly dayOfWeek: number;
}

export interface BookingHoursDateException {
  readonly id: string;
  readonly date: string;
  readonly windows: ReadonlyArray<TimeWindow>;
}

export interface BookingHoursDay {
  readonly date: string;
  readonly source: "regular" | "exception";
  readonly windows: ReadonlyArray<TimeWindow>;
}

export interface AvailabilityOverview {
  readonly configured: boolean;
  readonly localToday: string;
  readonly rangeFrom: string;
  readonly rangeTo: string;
  readonly weeklyHours: ReadonlyArray<WeeklyBookingHoursWindow>;
  readonly dateExceptions: ReadonlyArray<BookingHoursDateException>;
  readonly days: ReadonlyArray<BookingHoursDay>;
}

export interface BookingHoursConfiguration {
  readonly configured: boolean;
  readonly weeklyHours: ReadonlyArray<WeeklyBookingHoursWindow>;
  readonly dateExceptions: ReadonlyArray<BookingHoursDateException>;
}

export class InvalidAvailabilityInput extends Schema.TaggedError<InvalidAvailabilityInput>()(
  "InvalidAvailabilityInput",
  {},
) {}

export class AvailabilityNotFound extends Schema.TaggedError<AvailabilityNotFound>()(
  "AvailabilityNotFound",
  {},
) {}

export class AvailabilityUnavailable extends Schema.TaggedError<AvailabilityUnavailable>()(
  "AvailabilityUnavailable",
  {},
) {}
