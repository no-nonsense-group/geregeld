import { Context, type Effect, type Option } from "effect";

import type { UserId } from "#/contexts/identity/slices/register/contract";
import type {
  IanaTimeZone,
  Organization,
  OrganizationName,
  OrganizationUnavailable,
} from "./contract";

export interface SetupOrganizationGatewayService {
  readonly findForUser: (
    userId: UserId,
  ) => Effect.Effect<Option.Option<Organization>, OrganizationUnavailable>;
  readonly setupForOwner: (input: {
    readonly userId: UserId;
    readonly name: OrganizationName;
    readonly timeZone: IanaTimeZone;
    readonly termsVersion: string;
  }) => Effect.Effect<Organization, OrganizationUnavailable>;
}

export class SetupOrganizationGateway extends Context.Tag(
  "@geregeld/organizations/SetupOrganizationGateway",
)<SetupOrganizationGateway, SetupOrganizationGatewayService>() {}
