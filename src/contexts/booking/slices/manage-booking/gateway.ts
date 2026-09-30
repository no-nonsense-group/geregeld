import { Context, type Effect } from "effect";
import type { OrganizationId } from "#/contexts/organizations/slices/setup-organization/contract";
import type {
  BookingChange,
  BookingSetup,
  BookingSetupUnavailable,
} from "./contract";
export class BookingSetupGateway extends Context.Tag(
  "@geregeld/booking/BookingSetupGateway",
)<
  BookingSetupGateway,
  {
    readonly get: (
      organizationId: OrganizationId,
    ) => Effect.Effect<BookingSetup, BookingSetupUnavailable>;
    readonly save: (
      organizationId: OrganizationId,
      change: BookingChange,
    ) => Effect.Effect<void, BookingSetupUnavailable>;
  }
>() {}
