import { Effect } from "effect";
import type { OrganizationId } from "#/contexts/organizations/slices/setup-organization/contract";
import { bookingChangeSchema, InvalidBookingChange } from "./contract";
import { BookingSetupGateway } from "./gateway";
export function saveBookingSetup(
  organizationId: OrganizationId,
  input: unknown,
) {
  return Effect.gen(function* () {
    const parsed = bookingChangeSchema.safeParse(input);
    if (!parsed.success) return yield* new InvalidBookingChange();
    const gateway = yield* BookingSetupGateway;
    yield* gateway.save(organizationId, parsed.data);
  });
}
