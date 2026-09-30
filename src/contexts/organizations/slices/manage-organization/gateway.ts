import { Context, type Effect } from "effect";

import type { UserId } from "#/contexts/identity/slices/register/contract";
import type {
  IanaTimeZone,
  Organization,
  OrganizationName,
} from "../setup-organization/contract";
import type { OrganizationManagementUnavailable } from "./contract";

export interface ManageOrganizationGatewayService {
  readonly updateForUser: (input: {
    readonly userId: UserId;
    readonly name: OrganizationName;
    readonly timeZone: IanaTimeZone;
  }) => Effect.Effect<Organization, OrganizationManagementUnavailable>;
  readonly deleteForUser: (
    userId: UserId,
  ) => Effect.Effect<void, OrganizationManagementUnavailable>;
}

export class ManageOrganizationGateway extends Context.Tag(
  "@geregeld/organizations/ManageOrganizationGateway",
)<ManageOrganizationGateway, ManageOrganizationGatewayService>() {}
