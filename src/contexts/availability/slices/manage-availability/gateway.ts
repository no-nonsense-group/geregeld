import { Context, type Effect } from "effect";

import type { OrganizationId } from "#/contexts/organizations/slices/setup-organization/contract";
import type {
  AvailabilityNotFound,
  AvailabilityUnavailable,
  BookingHoursConfiguration,
  BookingHoursDateException,
  TimeWindow,
  WeeklyBookingHoursWindow,
} from "./contract";

export interface AvailabilityGatewayService {
  readonly getConfiguration: (input: {
    readonly organizationId: OrganizationId;
    readonly from: string;
    readonly to: string;
  }) => Effect.Effect<BookingHoursConfiguration, AvailabilityUnavailable>;
  readonly replaceWeeklyHours: (input: {
    readonly organizationId: OrganizationId;
    readonly windows: ReadonlyArray<WeeklyBookingHoursWindow>;
  }) => Effect.Effect<void, AvailabilityUnavailable>;
  readonly upsertDateException: (input: {
    readonly organizationId: OrganizationId;
    readonly date: string;
    readonly windows: ReadonlyArray<TimeWindow>;
  }) => Effect.Effect<BookingHoursDateException, AvailabilityUnavailable>;
  readonly upsertDateExceptions: (input: {
    readonly organizationId: OrganizationId;
    readonly dates: ReadonlyArray<string>;
    readonly windows: ReadonlyArray<TimeWindow>;
  }) => Effect.Effect<
    ReadonlyArray<BookingHoursDateException>,
    AvailabilityUnavailable
  >;
  readonly deleteDateException: (input: {
    readonly organizationId: OrganizationId;
    readonly date: string;
  }) => Effect.Effect<void, AvailabilityNotFound | AvailabilityUnavailable>;
}

export class AvailabilityGateway extends Context.Tag(
  "@geregeld/availability/AvailabilityGateway",
)<AvailabilityGateway, AvailabilityGatewayService>() {}
