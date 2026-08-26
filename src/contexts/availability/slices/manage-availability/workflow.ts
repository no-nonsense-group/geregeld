import { Effect } from "effect";

import type {
  IanaTimeZone,
  OrganizationId,
} from "#/contexts/organizations/slices/setup-organization/contract";
import {
  InvalidAvailabilityInput,
  type TimeWindow,
  type WeeklyBookingHoursWindow,
} from "./contract";
import { AvailabilityGateway } from "./gateway";
import {
  addLocalDays,
  isLocalDate,
  localDateDayOfWeek,
  localDateToEpochDay,
  localNow,
  weekStartsOnMonday,
} from "./local-date";

const latestDate = "2099-12-31";
const maximumWeeklyWindows = 50;
const maximumExceptionWindows = 20;
const maximumExceptionDates = 366;

function isIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function decodeTimeWindow(value: unknown): TimeWindow | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const input = value as Record<string, unknown>;
  if (
    !isIntegerBetween(input.startMinute, 0, 1439) ||
    !isIntegerBetween(input.endMinute, 1, 1440) ||
    input.startMinute >= input.endMinute
  ) {
    return undefined;
  }

  return {
    startMinute: input.startMinute,
    endMinute: input.endMinute,
  };
}

function decodeWeeklyWindow(
  value: unknown,
): WeeklyBookingHoursWindow | undefined {
  const window = decodeTimeWindow(value);
  if (!window || !value || typeof value !== "object") {
    return undefined;
  }

  const dayOfWeek = (value as Record<string, unknown>).dayOfWeek;
  if (!isIntegerBetween(dayOfWeek, 0, 6)) {
    return undefined;
  }

  return { dayOfWeek, ...window };
}

function windowsOverlap(windows: ReadonlyArray<TimeWindow>): boolean {
  const sorted = [...windows].sort(
    (left, right) => left.startMinute - right.startMinute,
  );
  return sorted.some(
    (window, index) =>
      index > 0 && sorted[index - 1].endMinute > window.startMinute,
  );
}

function weeklyWindowsOverlap(
  windows: ReadonlyArray<WeeklyBookingHoursWindow>,
): boolean {
  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    windows.filter((window) => window.dayOfWeek === dayOfWeek),
  ).some(windowsOverlap);
}

function decodeWindowArray(
  value: unknown,
  maximum: number,
): ReadonlyArray<TimeWindow> | undefined {
  if (!Array.isArray(value) || value.length > maximum) {
    return undefined;
  }

  const windows = value.map(decodeTimeWindow);
  if (windows.some((window) => window === undefined)) {
    return undefined;
  }

  const decoded = windows as ReadonlyArray<TimeWindow>;
  return windowsOverlap(decoded) ? undefined : decoded;
}

export function getAvailabilityOverview(
  organizationId: OrganizationId,
  timeZone: IanaTimeZone,
  input: unknown,
  now = new Date(),
) {
  return Effect.gen(function* () {
    const current = localNow(timeZone, now);
    let from = weekStartsOnMonday(current.date);
    let to = addLocalDays(from, 6);

    if (input && typeof input === "object") {
      const candidate = input as Record<string, unknown>;
      if (candidate.from !== undefined || candidate.to !== undefined) {
        if (!isLocalDate(candidate.from) || !isLocalDate(candidate.to)) {
          return yield* new InvalidAvailabilityInput();
        }

        const length =
          localDateToEpochDay(candidate.to) -
          localDateToEpochDay(candidate.from);
        if (length < 0 || length > 365) {
          return yield* new InvalidAvailabilityInput();
        }

        from = candidate.from;
        to = candidate.to;
      }
    }

    const gateway = yield* AvailabilityGateway;
    const configuration = yield* gateway.getConfiguration({
      organizationId,
      from,
      to,
    });
    const exceptionByDate = new Map(
      configuration.dateExceptions.map((exception) => [
        exception.date,
        exception,
      ]),
    );
    const days = Array.from(
      {
        length: localDateToEpochDay(to) - localDateToEpochDay(from) + 1,
      },
      (_, index) => {
        const date = addLocalDays(from, index);
        const exception = exceptionByDate.get(date);
        if (exception) {
          return {
            date,
            source: "exception" as const,
            windows: exception.windows,
          };
        }

        const dayOfWeek = localDateDayOfWeek(date);
        return {
          date,
          source: "regular" as const,
          windows: configuration.weeklyHours
            .filter((window) => window.dayOfWeek === dayOfWeek)
            .map(({ startMinute, endMinute }) => ({
              startMinute,
              endMinute,
            })),
        };
      },
    );

    return {
      configured: configuration.configured,
      localToday: current.date,
      rangeFrom: from,
      rangeTo: to,
      weeklyHours: configuration.weeklyHours,
      dateExceptions: configuration.dateExceptions,
      days,
    };
  }).pipe(Effect.withSpan("availability.getOverview"));
}

export function replaceWeeklyBookingHours(
  organizationId: OrganizationId,
  input: unknown,
) {
  return Effect.gen(function* () {
    if (!input || typeof input !== "object") {
      return yield* new InvalidAvailabilityInput();
    }

    const value = (input as Record<string, unknown>).windows;
    if (!Array.isArray(value) || value.length > maximumWeeklyWindows) {
      return yield* new InvalidAvailabilityInput();
    }

    const windows = value.map(decodeWeeklyWindow);
    const decoded = windows as ReadonlyArray<WeeklyBookingHoursWindow>;
    if (
      windows.some((window) => window === undefined) ||
      weeklyWindowsOverlap(decoded)
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    yield* gateway.replaceWeeklyHours({ organizationId, windows: decoded });
  }).pipe(Effect.withSpan("availability.replaceWeeklyHours"));
}

export function upsertBookingHoursDateException(
  organizationId: OrganizationId,
  timeZone: IanaTimeZone,
  input: unknown,
  now = new Date(),
) {
  return Effect.gen(function* () {
    if (!input || typeof input !== "object") {
      return yield* new InvalidAvailabilityInput();
    }

    const candidate = input as Record<string, unknown>;
    const windows = decodeWindowArray(
      candidate.windows,
      maximumExceptionWindows,
    );
    const today = localNow(timeZone, now).date;
    if (
      !isLocalDate(candidate.date) ||
      candidate.date < today ||
      candidate.date > latestDate ||
      !windows
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    return yield* gateway.upsertDateException({
      organizationId,
      date: candidate.date,
      windows,
    });
  }).pipe(Effect.withSpan("availability.upsertDateException"));
}

export function upsertBookingHoursDateRange(
  organizationId: OrganizationId,
  timeZone: IanaTimeZone,
  input: unknown,
  now = new Date(),
) {
  return Effect.gen(function* () {
    if (!input || typeof input !== "object") {
      return yield* new InvalidAvailabilityInput();
    }

    const candidate = input as Record<string, unknown>;
    const windows = decodeWindowArray(
      candidate.windows,
      maximumExceptionWindows,
    );
    const today = localNow(timeZone, now).date;
    if (
      !isLocalDate(candidate.from) ||
      !isLocalDate(candidate.to) ||
      candidate.from < today ||
      candidate.to < candidate.from ||
      candidate.to > latestDate ||
      localDateToEpochDay(candidate.to) - localDateToEpochDay(candidate.from) >
        365 ||
      !windows
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const dates = Array.from(
      {
        length:
          localDateToEpochDay(candidate.to) -
          localDateToEpochDay(candidate.from) +
          1,
      },
      (_, index) => addLocalDays(candidate.from as string, index),
    );
    const gateway = yield* AvailabilityGateway;
    return yield* gateway.upsertDateExceptions({
      organizationId,
      dates,
      windows,
    });
  }).pipe(Effect.withSpan("availability.upsertDateRange"));
}

export function upsertBookingHoursDates(
  organizationId: OrganizationId,
  timeZone: IanaTimeZone,
  input: unknown,
  now = new Date(),
) {
  return Effect.gen(function* () {
    if (!input || typeof input !== "object") {
      return yield* new InvalidAvailabilityInput();
    }

    const candidate = input as Record<string, unknown>;
    const windows = decodeWindowArray(
      candidate.windows,
      maximumExceptionWindows,
    );
    const today = localNow(timeZone, now).date;
    if (
      !Array.isArray(candidate.dates) ||
      candidate.dates.length === 0 ||
      candidate.dates.length > maximumExceptionDates ||
      !windows
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    if (!candidate.dates.every(isLocalDate)) {
      return yield* new InvalidAvailabilityInput();
    }
    const dates: Array<string> = [...new Set(candidate.dates)];
    if (dates.some((date) => date < today || date > latestDate)) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    return yield* gateway.upsertDateExceptions({
      organizationId,
      dates,
      windows,
    });
  }).pipe(Effect.withSpan("availability.upsertDates"));
}

export function deleteBookingHoursDateException(
  organizationId: OrganizationId,
  input: unknown,
) {
  return Effect.gen(function* () {
    if (
      !input ||
      typeof input !== "object" ||
      !isLocalDate((input as Record<string, unknown>).date)
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    yield* gateway.deleteDateException({
      organizationId,
      date: (input as { date: string }).date,
    });
  }).pipe(Effect.withSpan("availability.deleteDateException"));
}
