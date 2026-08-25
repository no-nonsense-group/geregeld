import { Effect } from "effect";

import type {
  IanaTimeZone,
  OrganizationId,
} from "#/contexts/organizations/slices/setup-organization/contract";
import {
  AvailabilityBulkLimitExceeded,
  type DatedAvailabilityPeriod,
  InvalidAvailabilityInput,
  type WeeklyRange,
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
const maximumBulkPeriods = 1000;

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

function isPeriodInput(value: unknown): value is DatedAvailabilityPeriod {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Record<string, unknown>;
  if (
    isLocalDate(input.date) &&
    isIntegerBetween(input.startMinute, 0, 1439) &&
    isIntegerBetween(input.endMinute, 1, 1440) &&
    input.startMinute < input.endMinute
  ) {
    return true;
  }

  return false;
}

function validateFuturePeriod(
  value: unknown,
  timeZone: IanaTimeZone,
  now: Date,
): DatedAvailabilityPeriod {
  if (!isPeriodInput(value)) {
    throw new InvalidAvailabilityInput();
  }

  const current = localNow(timeZone, now);
  if (
    value.date > latestDate ||
    value.date < current.date ||
    (value.date === current.date && value.startMinute <= current.minute)
  ) {
    throw new InvalidAvailabilityInput();
  }

  return value;
}

function decodeRange(value: unknown): WeeklyRange | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const input = value as Record<string, unknown>;
  if (
    !isIntegerBetween(input.dayOfWeek, 0, 6) ||
    !isIntegerBetween(input.startMinute, 0, 1439) ||
    !isIntegerBetween(input.endMinute, 1, 1440) ||
    input.startMinute >= input.endMinute
  ) {
    return undefined;
  }

  return {
    dayOfWeek: input.dayOfWeek,
    startMinute: input.startMinute,
    endMinute: input.endMinute,
  };
}

function periodsOverlap(
  left: DatedAvailabilityPeriod,
  right: DatedAvailabilityPeriod,
) {
  return (
    left.date === right.date &&
    left.startMinute < right.endMinute &&
    left.endMinute > right.startMinute
  );
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
    return yield* gateway.getOverview({
      organizationId,
      today: current.date,
      currentMinute: current.minute,
      from,
      to,
    });
  }).pipe(Effect.withSpan("availability.getOverview"));
}

export function updateDefaultAvailabilityDuration(
  organizationId: OrganizationId,
  input: unknown,
) {
  return Effect.gen(function* () {
    if (
      !input ||
      typeof input !== "object" ||
      !isIntegerBetween((input as Record<string, unknown>).minutes, 1, 1440)
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    yield* gateway.updateDefaultDuration({
      organizationId,
      minutes: (input as { minutes: number }).minutes,
    });
  }).pipe(Effect.withSpan("availability.updateDefaultDuration"));
}

export function applyWeeklyAvailability(
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
    const ranges = Array.isArray(candidate.ranges)
      ? candidate.ranges.map(decodeRange)
      : [];
    if (
      !isLocalDate(candidate.startDate) ||
      !isLocalDate(candidate.endDate) ||
      !isIntegerBetween(candidate.durationMinutes, 1, 1440) ||
      ranges.length === 0 ||
      ranges.some((range) => !range)
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const current = localNow(timeZone, now);
    const startDay = localDateToEpochDay(candidate.startDate);
    const endDay = localDateToEpochDay(candidate.endDate);
    const today = localDateToEpochDay(current.date);
    if (
      startDay < today ||
      endDay < startDay ||
      endDay - startDay > 364 ||
      candidate.endDate > latestDate
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const decodedRanges = ranges as Array<WeeklyRange>;
    const periods: Array<DatedAvailabilityPeriod> = [];
    for (let epochDay = startDay; epochDay <= endDay; epochDay += 1) {
      const date = addLocalDays(candidate.startDate, epochDay - startDay);
      const dayOfWeek = localDateDayOfWeek(date);
      for (const range of decodedRanges) {
        if (range.dayOfWeek !== dayOfWeek) {
          continue;
        }

        for (
          let startMinute = range.startMinute;
          startMinute + candidate.durationMinutes <= range.endMinute;
          startMinute += candidate.durationMinutes
        ) {
          if (date === current.date && startMinute <= current.minute) {
            continue;
          }

          periods.push({
            date,
            startMinute,
            endMinute: startMinute + candidate.durationMinutes,
          });

          if (periods.length > maximumBulkPeriods) {
            return yield* new AvailabilityBulkLimitExceeded();
          }
        }
      }
    }

    if (periods.length === 0) {
      return yield* new InvalidAvailabilityInput();
    }

    const sorted = [...periods].sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.startMinute - right.startMinute,
    );
    if (
      sorted.some(
        (period, index) =>
          index > 0 && periodsOverlap(sorted[index - 1], period),
      )
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    yield* gateway.replaceRange({
      organizationId,
      from: candidate.startDate,
      to: candidate.endDate,
      periods,
    });

    return { created: periods.length };
  }).pipe(Effect.withSpan("availability.applyWeekly"));
}

export function createAvailabilityPeriod(
  organizationId: OrganizationId,
  timeZone: IanaTimeZone,
  input: unknown,
  now = new Date(),
) {
  return Effect.gen(function* () {
    const period = yield* Effect.try({
      try: () => validateFuturePeriod(input, timeZone, now),
      catch: () => new InvalidAvailabilityInput(),
    });
    const gateway = yield* AvailabilityGateway;
    return yield* gateway.createPeriod({ organizationId, period });
  }).pipe(Effect.withSpan("availability.createPeriod"));
}

export function updateAvailabilityPeriod(
  organizationId: OrganizationId,
  timeZone: IanaTimeZone,
  input: unknown,
  now = new Date(),
) {
  return Effect.gen(function* () {
    if (
      !input ||
      typeof input !== "object" ||
      typeof (input as Record<string, unknown>).id !== "string" ||
      (input as { id: string }).id.length === 0
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const candidate = input as Record<string, unknown>;
    const period = yield* Effect.try({
      try: () =>
        validateFuturePeriod(
          {
            date: candidate.date,
            startMinute: candidate.startMinute,
            endMinute: candidate.endMinute,
          },
          timeZone,
          now,
        ),
      catch: () => new InvalidAvailabilityInput(),
    });
    const gateway = yield* AvailabilityGateway;
    return yield* gateway.updatePeriod({
      organizationId,
      id: candidate.id as string,
      period,
    });
  }).pipe(Effect.withSpan("availability.updatePeriod"));
}

export function deleteAvailabilityPeriod(
  organizationId: OrganizationId,
  input: unknown,
) {
  return Effect.gen(function* () {
    if (
      !input ||
      typeof input !== "object" ||
      typeof (input as Record<string, unknown>).id !== "string" ||
      (input as { id: string }).id.length === 0
    ) {
      return yield* new InvalidAvailabilityInput();
    }

    const gateway = yield* AvailabilityGateway;
    yield* gateway.deletePeriod({
      organizationId,
      id: (input as { id: string }).id,
    });
  }).pipe(Effect.withSpan("availability.deletePeriod"));
}
