import { expect, it } from "@effect/vitest";
import { Effect, Layer, Option } from "effect";

import { UserId } from "#/contexts/identity/slices/register/contract";
import { currentTermsVersion } from "#/shared/legal/terms";
import {
  IanaTimeZone,
  InvalidSetupOrganizationInput,
  OrganizationId,
  OrganizationName,
} from "./contract";
import {
  SetupOrganizationGateway,
  type SetupOrganizationGatewayService,
} from "./gateway";
import { findOrganizationForUser, setupOrganization } from "./workflow";

const userId = UserId.make("user-1");
const organization = {
  id: OrganizationId.make("organization-1"),
  name: OrganizationName.make("Studio Noord"),
  timeZone: IanaTimeZone.make("Europe/Amsterdam"),
  availabilityConfiguredAt: null,
};

function makeGateway(existing = false) {
  const calls: Array<unknown> = [];
  const service: SetupOrganizationGatewayService = {
    findForUser: () =>
      Effect.succeed(existing ? Option.some(organization) : Option.none()),
    setupForOwner: (input) =>
      Effect.sync(() => {
        calls.push(input);
        return organization;
      }),
  };

  return {
    calls,
    layer: Layer.succeed(SetupOrganizationGateway, service),
  };
}

it.effect("creates an Organization and Owner from valid setup input", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* setupOrganization(userId, {
      name: "  Studio Noord  ",
      timeZone: "Europe/Amsterdam",
      termsAccepted: true,
    });

    expect(result).toEqual(organization);
    expect(gateway.calls).toEqual([
      {
        userId,
        name: "Studio Noord",
        timeZone: "Europe/Amsterdam",
        termsVersion: currentTermsVersion,
      },
    ]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("requires terms acceptance", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      setupOrganization(userId, {
        name: "Studio Noord",
        timeZone: "Europe/Amsterdam",
        termsAccepted: false,
      }),
    );

    expect(error).toBeInstanceOf(InvalidSetupOrganizationInput);
    expect(gateway.calls).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("requires a business name", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      setupOrganization(userId, {
        name: "   ",
        timeZone: "Europe/Amsterdam",
        termsAccepted: true,
      }),
    );

    expect(error).toBeInstanceOf(InvalidSetupOrganizationInput);
    expect(gateway.calls).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("rejects an invalid time zone", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      setupOrganization(userId, {
        name: "Studio Noord",
        timeZone: "Amsterdam",
        termsAccepted: true,
      }),
    );

    expect(error).toBeInstanceOf(InvalidSetupOrganizationInput);
    expect(gateway.calls).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("finds the Organization for an existing member", () => {
  const gateway = makeGateway(true);

  return Effect.gen(function* () {
    const result = yield* findOrganizationForUser(userId);
    expect(Option.getOrUndefined(result)).toEqual(organization);
  }).pipe(Effect.provide(gateway.layer));
});
