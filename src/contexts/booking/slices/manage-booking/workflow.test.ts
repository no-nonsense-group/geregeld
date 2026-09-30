import { expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { OrganizationId } from "#/contexts/organizations/slices/setup-organization/contract";
import { bookingChangeSchema, InvalidBookingChange } from "./contract";
import { BookingSetupGateway } from "./gateway";
import { saveBookingSetup } from "./workflow";

it("accepts a user-defined consultation and individual table capacities", () => {
  expect(
    bookingChangeSchema.parse({
      action: "service",
      name: "  First consultation  ",
      durationMinutes: 45,
      active: true,
    }),
  ).toMatchObject({ name: "First consultation" });
  for (const capacity of [4, 6, 8])
    expect(
      bookingChangeSchema.safeParse({
        action: "resource",
        kind: "tables",
        name: "Window",
        capacity,
        active: true,
      }).success,
    ).toBe(true);
});
it("rejects blank names, fractional capacity and invalid durations", () => {
  for (const capacity of [0, -1, 1.5, 1001, "4"])
    expect(
      bookingChangeSchema.safeParse({
        action: "resource",
        kind: "rooms",
        name: "Studio",
        capacity,
        active: true,
      }).success,
    ).toBe(false);
  for (const durationMinutes of [0, 1441, 0.5])
    expect(
      bookingChangeSchema.safeParse({
        action: "service",
        name: "Consult",
        durationMinutes,
        active: true,
      }).success,
    ).toBe(false);
  expect(
    bookingChangeSchema.safeParse({
      action: "service",
      name: "  ",
      durationMinutes: 30,
      active: true,
    }).success,
  ).toBe(false);
});
it.effect("invalid changes never reach persistence", () =>
  Effect.gen(function* () {
    let called = false;
    const result = yield* saveBookingSetup(OrganizationId.make("org"), {
      action: "mode",
      mode: "unknown",
    }).pipe(
      Effect.flip,
      Effect.provide(
        Layer.succeed(BookingSetupGateway, {
          get: () =>
            Effect.succeed({ mode: null, resources: [], services: [] }),
          save: () =>
            Effect.sync(() => {
              called = true;
            }),
        }),
      ),
    );
    expect(result).toBeInstanceOf(InvalidBookingChange);
    expect(called).toBe(false);
  }),
);
