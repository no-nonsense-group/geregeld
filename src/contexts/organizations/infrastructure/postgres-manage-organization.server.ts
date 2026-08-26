import "@tanstack/react-start/server-only";

import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { OrganizationManagementUnavailable } from "#/contexts/organizations/slices/manage-organization/contract";
import { ManageOrganizationGateway } from "#/contexts/organizations/slices/manage-organization/gateway";
import {
  IanaTimeZone,
  OrganizationId,
  OrganizationName,
} from "#/contexts/organizations/slices/setup-organization/contract";
import { database } from "#/platform/database/drizzle.server";
import {
  identity_login_challenge,
  identity_registration_challenge,
  identity_user,
  organization,
  organization_membership,
} from "#/platform/database/schema";

export const PostgresManageOrganizationLive = Layer.succeed(
  ManageOrganizationGateway,
  {
    updateForUser: (input) =>
      Effect.tryPromise({
        try: async () =>
          database.transaction(async (transaction) => {
            const [membership] = await transaction
              .select({
                organizationId: organization_membership.organizationId,
              })
              .from(organization_membership)
              .where(eq(organization_membership.userId, input.userId))
              .limit(1);

            if (!membership) {
              throw new Error("Organization membership was not found");
            }

            const [updated] = await transaction
              .update(organization)
              .set({ name: input.name, timeZone: input.timeZone })
              .where(eq(organization.id, membership.organizationId))
              .returning();

            if (!updated) {
              throw new Error("Organization was not found");
            }

            return {
              id: OrganizationId.make(updated.id),
              name: OrganizationName.make(updated.name),
              timeZone: IanaTimeZone.make(updated.timeZone),
              availabilityConfiguredAt: updated.availabilityConfiguredAt,
            };
          }),
        catch: () => new OrganizationManagementUnavailable(),
      }),
    deleteForUser: (userId) =>
      Effect.tryPromise({
        try: async () => {
          await database.transaction(async (transaction) => {
            const [record] = await transaction
              .select({
                email: identity_user.email,
                organizationId: organization_membership.organizationId,
              })
              .from(identity_user)
              .innerJoin(
                organization_membership,
                eq(organization_membership.userId, identity_user.id),
              )
              .where(eq(identity_user.id, userId))
              .limit(1);

            if (!record) {
              throw new Error("Organization membership was not found");
            }

            await transaction
              .delete(organization)
              .where(eq(organization.id, record.organizationId));
            await transaction
              .delete(identity_login_challenge)
              .where(eq(identity_login_challenge.email, record.email));
            await transaction
              .delete(identity_registration_challenge)
              .where(eq(identity_registration_challenge.email, record.email));
            await transaction
              .delete(identity_user)
              .where(eq(identity_user.id, userId));
          });
        },
        catch: () => new OrganizationManagementUnavailable(),
      }),
  },
);
