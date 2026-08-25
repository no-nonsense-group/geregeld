import { Effect, Schema } from "effect";

import type { UserId } from "#/contexts/identity/slices/register/contract";
import { currentTermsVersion } from "#/shared/legal/terms";
import {
  InvalidSetupOrganizationInput,
  SetupOrganizationInput,
} from "./contract";
import { SetupOrganizationGateway } from "./gateway";

const decodeInput = Schema.decodeUnknown(SetupOrganizationInput);

export function findOrganizationForUser(userId: UserId) {
  return Effect.gen(function* () {
    const gateway = yield* SetupOrganizationGateway;
    return yield* gateway.findForUser(userId);
  }).pipe(Effect.withSpan("organizations.findForUser"));
}

export function setupOrganization(userId: UserId, input: unknown) {
  return Effect.gen(function* () {
    const decoded = yield* decodeInput(input).pipe(
      Effect.mapError(() => new InvalidSetupOrganizationInput()),
    );
    const gateway = yield* SetupOrganizationGateway;

    return yield* gateway.setupForOwner({
      userId,
      name: decoded.name,
      timeZone: decoded.timeZone,
      termsVersion: currentTermsVersion,
    });
  }).pipe(Effect.withSpan("organizations.setup"));
}
