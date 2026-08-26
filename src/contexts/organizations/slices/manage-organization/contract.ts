import { Schema } from "effect";

import { IanaTimeZone, OrganizationName } from "../setup-organization/contract";

export const UpdateOrganizationInput = Schema.Struct({
  name: OrganizationName,
  timeZone: IanaTimeZone,
});
export type UpdateOrganizationInput = typeof UpdateOrganizationInput.Type;

export class InvalidUpdateOrganizationInput extends Schema.TaggedError<InvalidUpdateOrganizationInput>()(
  "InvalidUpdateOrganizationInput",
  {},
) {}

export class OrganizationManagementUnavailable extends Schema.TaggedError<OrganizationManagementUnavailable>()(
  "OrganizationManagementUnavailable",
  {},
) {}
