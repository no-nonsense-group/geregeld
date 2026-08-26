import { expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import {
  IanaTimeZone,
  OrganizationId,
} from "#/contexts/organizations/slices/setup-organization/contract";
import { AvailabilityNotFound, InvalidAvailabilityInput } from "./contract";
import {
  AvailabilityGateway,
  type AvailabilityGatewayService,
} from "./gateway";
import {
  deleteBookingHoursDateException,
  getAvailabilityOverview,
  replaceWeeklyBookingHours,
  upsertBookingHoursDateException,
  upsertBookingHoursDateRange,
  upsertBookingHoursDates,
} from "./workflow";

const organizationId = OrganizationId.make("organization-1");
const timeZone = IanaTimeZone.make("Europe/Amsterdam");
const now = new Date("2026-08-25T08:30:00.000Z");

function makeGateway() {
  const weeklyReplacements: Array<unknown> = [];
  const exceptionUpserts: Array<unknown> = [];
  const exceptionDeletes: Array<unknown> = [];
  const configuration = {
    configured: true,
    weeklyHours: [
      {
        id: "weekly-1",
        dayOfWeek: 2,
        startMinute: 540,
        endMinute: 1020,
      },
      {
        id: "weekly-2",
        dayOfWeek: 3,
        startMinute: 540,
        endMinute: 1020,
      },
    ],
    dateExceptions: [{ id: "exception-1", date: "2026-08-26", windows: [] }],
  };
  const service: AvailabilityGatewayService = {
    getConfiguration: () => Effect.succeed(configuration),
    replaceWeeklyHours: (input) =>
      Effect.sync(() => {
        weeklyReplacements.push(input);
      }),
    upsertDateException: (input) =>
      Effect.sync(() => {
        exceptionUpserts.push(input);
        return {
          id: "exception-new",
          date: input.date,
          windows: input.windows,
        };
      }),
    upsertDateExceptions: (input) =>
      Effect.sync(() => {
        const results = input.dates.map((date, index) => {
          const item = {
            organizationId: input.organizationId,
            date,
            windows: input.windows,
          };
          exceptionUpserts.push(item);
          return {
            id: `exception-range-${index}`,
            date,
            windows: input.windows,
          };
        });
        return results;
      }),
    deleteDateException: (input) =>
      Effect.sync(() => {
        exceptionDeletes.push(input);
      }),
  };

  return {
    weeklyReplacements,
    exceptionUpserts,
    exceptionDeletes,
    service,
    layer: Layer.succeed(AvailabilityGateway, service),
  };
}

it.effect("keeps regular booking hours as continuous weekly windows", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* replaceWeeklyBookingHours(organizationId, {
      windows: [
        {
          dayOfWeek: 1,
          startMinute: 540,
          endMinute: 1020,
        },
      ],
    });

    expect(gateway.weeklyReplacements).toEqual([
      {
        organizationId,
        windows: [
          {
            dayOfWeek: 1,
            startMinute: 540,
            endMinute: 1020,
          },
        ],
      },
    ]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("allows an Organization to save every regular day as closed", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* replaceWeeklyBookingHours(organizationId, { windows: [] });
    expect(gateway.weeklyReplacements[0]).toMatchObject({ windows: [] });
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("rejects overlapping windows on the same weekday", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      replaceWeeklyBookingHours(organizationId, {
        windows: [
          { dayOfWeek: 1, startMinute: 540, endMinute: 720 },
          { dayOfWeek: 1, startMinute: 660, endMinute: 780 },
        ],
      }),
    );

    expect(error).toBeInstanceOf(InvalidAvailabilityInput);
    expect(gateway.weeklyReplacements).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect(
  "uses a Date Exception instead of regular hours for that date",
  () => {
    const gateway = makeGateway();

    return Effect.gen(function* () {
      const overview = yield* getAvailabilityOverview(
        organizationId,
        timeZone,
        { from: "2026-08-25", to: "2026-08-27" },
        now,
      );

      expect(overview.days).toEqual([
        {
          date: "2026-08-25",
          source: "regular",
          windows: [{ startMinute: 540, endMinute: 1020 }],
        },
        { date: "2026-08-26", source: "exception", windows: [] },
        {
          date: "2026-08-27",
          source: "regular",
          windows: [],
        },
      ]);
    }).pipe(Effect.provide(gateway.layer));
  },
);

it.effect("saves a closed-all-day Date Exception", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* upsertBookingHoursDateException(
      organizationId,
      timeZone,
      { date: "2026-08-26", windows: [] },
      now,
    );

    expect(result).toEqual({
      id: "exception-new",
      date: "2026-08-26",
      windows: [],
    });
    expect(gateway.exceptionUpserts[0]).toMatchObject({
      organizationId,
      date: "2026-08-26",
      windows: [],
    });
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("rejects a Date Exception in the past", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      upsertBookingHoursDateException(
        organizationId,
        timeZone,
        {
          date: "2026-08-24",
          windows: [{ startMinute: 540, endMinute: 1020 }],
        },
        now,
      ),
    );

    expect(error).toBeInstanceOf(InvalidAvailabilityInput);
    expect(gateway.exceptionUpserts).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("saves one Schedule Change for every date in a range", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* upsertBookingHoursDateRange(
      organizationId,
      timeZone,
      {
        from: "2026-08-27",
        to: "2026-08-29",
        windows: [],
      },
      now,
    );

    expect(result.map((item) => item.date)).toEqual([
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
    ]);
    expect(gateway.exceptionUpserts).toHaveLength(3);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("saves separate dates without changing the days between them", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* upsertBookingHoursDates(
      organizationId,
      timeZone,
      {
        dates: ["2026-08-31", "2026-09-02"],
        windows: [],
      },
      now,
    );

    expect(result.map((item) => item.date)).toEqual([
      "2026-08-31",
      "2026-09-02",
    ]);
    expect(gateway.exceptionUpserts).toEqual([
      { organizationId, date: "2026-08-31", windows: [] },
      { organizationId, date: "2026-09-02", windows: [] },
    ]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("deletes a Date Exception by date", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* deleteBookingHoursDateException(organizationId, {
      date: "2026-08-26",
    });
    expect(gateway.exceptionDeletes).toEqual([
      { organizationId, date: "2026-08-26" },
    ]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect(
  "keeps a not-found error returned while deleting an exception",
  () => {
    const service = makeGateway().service;
    const layer = Layer.succeed(AvailabilityGateway, {
      ...service,
      deleteDateException: () => Effect.fail(new AvailabilityNotFound()),
    });

    return Effect.gen(function* () {
      const error = yield* Effect.flip(
        deleteBookingHoursDateException(organizationId, {
          date: "2026-08-26",
        }),
      );
      expect(error).toBeInstanceOf(AvailabilityNotFound);
    }).pipe(Effect.provide(layer));
  },
);
