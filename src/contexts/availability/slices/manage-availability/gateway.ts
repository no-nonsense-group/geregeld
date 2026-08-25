import { Context, type Effect } from "effect";

import type { OrganizationId } from "#/contexts/organizations/slices/setup-organization/contract";
import type {
  AvailabilityConflict,
  AvailabilityNotFound,
  AvailabilityOverview,
  AvailabilityPeriod,
  AvailabilityUnavailable,
  DatedAvailabilityPeriod,
} from "./contract";

type GatewayError =
  | AvailabilityConflict
  | AvailabilityNotFound
  | AvailabilityUnavailable;

export interface AvailabilityGatewayService {
  readonly getOverview: (input: {
    readonly organizationId: OrganizationId;
    readonly today: string;
    readonly currentMinute: number;
    readonly from: string;
    readonly to: string;
  }) => Effect.Effect<AvailabilityOverview, AvailabilityUnavailable>;
  readonly updateDefaultDuration: (input: {
    readonly organizationId: OrganizationId;
    readonly minutes: number;
  }) => Effect.Effect<void, AvailabilityUnavailable>;
  readonly replaceRange: (input: {
    readonly organizationId: OrganizationId;
    readonly from: string;
    readonly to: string;
    readonly periods: ReadonlyArray<DatedAvailabilityPeriod>;
  }) => Effect.Effect<void, AvailabilityUnavailable>;
  readonly createPeriod: (input: {
    readonly organizationId: OrganizationId;
    readonly period: DatedAvailabilityPeriod;
  }) => Effect.Effect<
    AvailabilityPeriod,
    AvailabilityConflict | AvailabilityUnavailable
  >;
  readonly updatePeriod: (input: {
    readonly organizationId: OrganizationId;
    readonly id: string;
    readonly period: DatedAvailabilityPeriod;
  }) => Effect.Effect<AvailabilityPeriod, GatewayError>;
  readonly deletePeriod: (input: {
    readonly organizationId: OrganizationId;
    readonly id: string;
  }) => Effect.Effect<void, AvailabilityNotFound | AvailabilityUnavailable>;
}

export class AvailabilityGateway extends Context.Tag(
  "@geregeld/availability/AvailabilityGateway",
)<AvailabilityGateway, AvailabilityGatewayService>() {}
