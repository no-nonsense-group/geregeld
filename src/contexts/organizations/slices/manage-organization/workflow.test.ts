import { expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { UserId } from "#/contexts/identity/slices/register/contract";
import {
  IanaTimeZone,
  OrganizationId,
  OrganizationName,
} from "../setup-organization/contract";
import { InvalidUpdateOrganizationInput } from "./contract";
import {
  ManageOrganizationGateway,
  type ManageOrganizationGatewayService,
} from "./gateway";
import { deleteOrganizationAndUser, updateOrganization } from "./workflow";

const userId = UserId.make("user-1");
const organization = {
  id: OrganizationId.make("organization-1"),
  name: OrganizationName.make("Studio Noord"),
  timeZone: IanaTimeZone.make("Europe/Amsterdam"),
  availabilityConfiguredAt: null,
};

function makeGateway() {
  const updateCalls: Array<unknown> = [];
  const deleteCalls: Array<unknown> = [];
  const service: ManageOrganizationGatewayService = {
    updateForUser: (input) =>
      Effect.sync(() => {
        updateCalls.push(input);
        return organization;
      }),
    deleteForUser: (input) =>
      Effect.sync(() => {
        deleteCalls.push(input);
      }),
  };

  return {
    deleteCalls,
    updateCalls,
    layer: Layer.succeed(ManageOrganizationGateway, service),
  };
}

it.effect("updates an Organization from valid input", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const result = yield* updateOrganization(userId, {
      name: "  Studio Noord  ",
      timeZone: "Europe/Amsterdam",
    });

    expect(result).toEqual(organization);
    expect(gateway.updateCalls).toEqual([
      {
        userId,
        name: "Studio Noord",
        timeZone: "Europe/Amsterdam",
      },
    ]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("rejects invalid Organization updates", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    const error = yield* Effect.flip(
      updateOrganization(userId, {
        name: " ",
        timeZone: "Amsterdam",
      }),
    );

    expect(error).toBeInstanceOf(InvalidUpdateOrganizationInput);
    expect(gateway.updateCalls).toEqual([]);
  }).pipe(Effect.provide(gateway.layer));
});

it.effect("deletes the Organization and current User", () => {
  const gateway = makeGateway();

  return Effect.gen(function* () {
    yield* deleteOrganizationAndUser(userId);
    expect(gateway.deleteCalls).toEqual([userId]);
  }).pipe(Effect.provide(gateway.layer));
});
