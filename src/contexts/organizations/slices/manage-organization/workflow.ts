import { Effect, Schema } from "effect";

import type { UserId } from "#/contexts/identity/slices/register/contract";
import {
  InvalidUpdateOrganizationInput,
  UpdateOrganizationInput,
} from "./contract";
import { ManageOrganizationGateway } from "./gateway";

const decodeUpdateInput = Schema.decodeUnknown(UpdateOrganizationInput);

export function updateOrganization(userId: UserId, input: unknown) {
  return Effect.gen(function* () {
    const decoded = yield* decodeUpdateInput(input).pipe(
      Effect.mapError(() => new InvalidUpdateOrganizationInput()),
    );
    const gateway = yield* ManageOrganizationGateway;

    return yield* gateway.updateForUser({ userId, ...decoded });
  }).pipe(Effect.withSpan("organizations.update"));
}

export function deleteOrganizationAndUser(userId: UserId) {
  return ManageOrganizationGateway.pipe(
    Effect.flatMap((gateway) => gateway.deleteForUser(userId)),
    Effect.withSpan("organizations.deleteWithUser"),
  );
}
