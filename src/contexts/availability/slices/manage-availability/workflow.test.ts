import { expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import {
  IanaTimeZone,
  OrganizationId,
} from "#/contexts/organizations/slices/setup-organization/contract";
import {
  AvailabilityBulkLimitExceeded,
  AvailabilityConflict,
  type AvailabilityOverview,
  InvalidAvailabilityInput,
} from "./contract";
import {
  AvailabilityGateway,
  type AvailabilityGatewayService,
} from "./gateway";
import { localDateDayOfWeek } from "./local-date";
import {
  applyWeeklyAvailability,
  createAvailabilityPeriod,
  updateDefaultAvailabilityDuration,
} from "./workflow";

const organizationId = OrganizationId.make("organization-1");
const timeZone = IanaTimeZone.make("Europe/Amsterdam");
const now = new Date("2026-08-25T08:30:00.000Z");

function makeGateway() {
  const replacements: Array<unknown> = [];
  const created: Array<unknown> = [];
  const defaultDurations: Array<number> = [];
  const overview: AvailabilityOverview = {
    configured: false,
    defaultDurationMinutes: 30,
    localToday: "2026-08-25",
    rangeFrom: "2026-08-24",
    rangeTo: "2026-08-30",
    totalFuturePeriods: 0,
    periods: [],
  };
  const service: AvailabilityGatewayService = {
    getOverview: () => Effect.succeed(overview),
    updateDefaultDuration: ({ minutes }) =>
      Effect.sync(() => {
        defaultDurations.push(minutes);
      }),
    replaceRange: (input) =>
      Effect.sync(() => {
        replacements.push(input);
      }),
    createPeriod: (input) =>
      Effect.sync(() => {
        created.push(input);
        return { id: "period-1", ...input.period };
      }),
    updatePeriod: (input) => Effect.succeed({ id: input.id, ...input.period }),
    deletePeriod: () => Effect.void,
  };

  return {
    replacements,
    created,
    defaultDurations,
    service,
    layer: Layer.succeed(AvailabilityGateway, service),
  };
}

it.effect(
  "materializes complete periods and leaves the final remainder empty",
  () => {
    const gateway = makeGateway();
    const date = "2026-08-26";

    return Effect.gen(function* () {
      const result = yield* applyWeeklyAvailability(
        organizationId,
        timeZone,
        {
          startDate: date,
          endDate: date,
          durationMinutes: 60,
          ranges: [
            {
              dayOfWeek: localDateDayOfWeek(date),
              startMinute: 540,
              endMinute: 690,
            },
          ],
        },
        now,
      );

      expect(result).toEqual({ created: 2 });
      expect(gateway.replacements).toEqual([
        {
          organizationId,
          from: date,
          to: date,
          periods: [
            { date, startMinute: 540, endMinute: 600 },
            { date, startMinute: 600, endMinute: 660 },
          ],
        },
      ]);
    }).pipe(Effect.provide(gateway.layer));
  },
);

it.effect("omits generated periods that have already started today", () => {
  const gateway = makeGateway();
  const date = "2026-08-25";

  return Effect.gen(function* () {
    const result = yield* applyWeeklyAvailability(
      organizationId,
      timeZone,
      {
        startDate: date,
        endDate: date,
        durationMinutes: 60,
        ranges: [
          {
            dayOfWeek: localDateDayOfWeek(date),
            startMinute: 540,
            endMinute: 780,
          },
        ],
      },
      now,
    );

    expect(result).toEqual({ created: 2 });
    expect(gateway.replacements[0]).toMatchObject({
      periods: [
        { date, startMinute: 660, endMinute: 720 },
        { date, startMinute: 720, endMinute: 780 },
      ],
    });
  }).pipe(Effect.provide(gateway.layer));
});

it.effect(
  "rejects a bulk operation that would create more than 1,000 periods",
  () => {
    const gateway = makeGateway();
    const date = "2026-08-26";

    return Effect.gen(function* () {
      const error = yield* Effect.flip(
        applyWeeklyAvailability(
          organizationId,
          timeZone,
          {
            startDate: date,
            endDate: date,
            durationMinutes: 1,
            ranges: [
              {
                dayOfWeek: localDateDayOfWeek(date),
                startMinute: 0,
                endMinute: 1440,
              },
            ],
          },
          now,
        ),
      );

      expect(error).toBeInstanceOf(AvailabilityBulkLimitExceeded);
      expect(gateway.replacements).toEqual([]);
    }).pipe(Effect.provide(gateway.layer));
  },
);

it.effect("limits weekly materialization to 365 dates", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      applyWeeklyAvailability(
        organizationId,
        timeZone,
        {
          startDate: "2026-08-25",
          endDate: "2027-08-25",
          durationMinutes: 30,
          ranges: [{ dayOfWeek: 1, startMinute: 540, endMinute: 570 }],
        },
        now,
      ),
    );

    expect(error).toBeInstanceOf(InvalidAvailabilityInput);
    expect(gateway.replacements).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("requires manually created periods to start in the future", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      createAvailabilityPeriod(
        organizationId,
        timeZone,
        { date: "2026-08-25", startMinute: 600, endMinute: 630 },
        now,
      ),
    );

    expect(error).toBeInstanceOf(InvalidAvailabilityInput);
    expect(gateway.created).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("accepts a full-day manual period on a future date", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* createAvailabilityPeriod(
      organizationId,
      timeZone,
      { date: "2026-08-26", startMinute: 0, endMinute: 1440 },
      now,
    );

    expect(result).toEqual({
      id: "period-1",
      date: "2026-08-26",
      startMinute: 0,
      endMinute: 1440,
    });
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("updates the Organization default without touching periods", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* updateDefaultAvailabilityDuration(organizationId, { minutes: 45 });
    expect(gateway.defaultDurations).toEqual([45]);
    expect(gateway.replacements).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("keeps overlap conflicts returned by persistence", () => {
  const service = makeGateway().service;
  const conflictLayer = Layer.succeed(AvailabilityGateway, {
    ...service,
    createPeriod: () => Effect.fail(new AvailabilityConflict()),
  });

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      createAvailabilityPeriod(
        organizationId,
        timeZone,
        { date: "2026-08-26", startMinute: 540, endMinute: 600 },
        now,
      ),
    );
    expect(error).toBeInstanceOf(AvailabilityConflict);
  }).pipe(Effect.provide(conflictLayer));
});
