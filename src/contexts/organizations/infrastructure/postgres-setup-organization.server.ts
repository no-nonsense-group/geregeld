import "@tanstack/react-start/server-only";

import { eq } from "drizzle-orm";
import { Effect, Layer, Option } from "effect";

import {
  IanaTimeZone,
  OrganizationId,
  OrganizationName,
  OrganizationUnavailable,
} from "#/contexts/organizations/slices/setup-organization/contract";
import { SetupOrganizationGateway } from "#/contexts/organizations/slices/setup-organization/gateway";
import { database } from "#/platform/database/drizzle.server";
import {
  identity_user,
  organization,
  organization_membership,
} from "#/platform/database/schema";

async function findForUser(userId: string) {
  const [record] = await database
    .select({
      id: organization.id,
      name: organization.name,
      timeZone: organization.timeZone,
    })
    .from(organization_membership)
    .innerJoin(
      organization,
      eq(organization_membership.organizationId, organization.id),
    )
    .where(eq(organization_membership.userId, userId))
    .limit(1);

  return record
    ? Option.some({
        id: OrganizationId.make(record.id),
        name: OrganizationName.make(record.name),
        timeZone: IanaTimeZone.make(record.timeZone),
      })
    : Option.none();
}

export const PostgresSetupOrganizationLive = Layer.succeed(
  SetupOrganizationGateway,
  {
    findForUser: (userId) =>
      Effect.tryPromise({
        try: () => findForUser(userId),
        catch: () => new OrganizationUnavailable(),
      }),
    setupForOwner: (input) =>
      Effect.tryPromise({
        try: async () =>
          database.transaction(async (transaction) => {
            const [existing] = await transaction
              .select({
                id: organization.id,
                name: organization.name,
                timeZone: organization.timeZone,
              })
              .from(organization_membership)
              .innerJoin(
                organization,
                eq(organization_membership.organizationId, organization.id),
              )
              .where(eq(organization_membership.userId, input.userId))
              .limit(1);

            if (existing) {
              return {
                id: OrganizationId.make(existing.id),
                name: OrganizationName.make(existing.name),
                timeZone: IanaTimeZone.make(existing.timeZone),
              };
            }

            const [created] = await transaction
              .insert(organization)
              .values({ name: input.name, timeZone: input.timeZone })
              .returning();

            if (!created) {
              throw new Error("PostgreSQL did not return the Organization");
            }

            const memberships = await transaction
              .insert(organization_membership)
              .values({
                organizationId: created.id,
                userId: input.userId,
                role: "owner",
              })
              .onConflictDoNothing({
                target: organization_membership.userId,
              })
              .returning({ id: organization_membership.id });

            if (memberships.length === 0) {
              await transaction
                .delete(organization)
                .where(eq(organization.id, created.id));

              const [concurrent] = await transaction
                .select({
                  id: organization.id,
                  name: organization.name,
                  timeZone: organization.timeZone,
                })
                .from(organization_membership)
                .innerJoin(
                  organization,
                  eq(organization_membership.organizationId, organization.id),
                )
                .where(eq(organization_membership.userId, input.userId))
                .limit(1);

              if (!concurrent) {
                throw new Error("Existing Organization was not found");
              }

              return {
                id: OrganizationId.make(concurrent.id),
                name: OrganizationName.make(concurrent.name),
                timeZone: IanaTimeZone.make(concurrent.timeZone),
              };
            }

            await transaction
              .update(identity_user)
              .set({
                termsAcceptedAt: new Date(),
                termsVersion: input.termsVersion,
              })
              .where(eq(identity_user.id, input.userId));

            return {
              id: OrganizationId.make(created.id),
              name: OrganizationName.make(created.name),
              timeZone: IanaTimeZone.make(created.timeZone),
            };
          }),
        catch: () => new OrganizationUnavailable(),
      }),
  },
);
