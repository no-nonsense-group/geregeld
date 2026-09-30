import "@tanstack/react-start/server-only";
import { and, asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { BookingSetupUnavailable } from "#/contexts/booking/slices/manage-booking/contract";
import { BookingSetupGateway } from "#/contexts/booking/slices/manage-booking/gateway";
import { database } from "#/platform/database/drizzle.server";
import {
  bookable_resource,
  bookable_service,
  organization,
} from "#/platform/database/schema";
export const PostgresBookingSetupLive = Layer.succeed(BookingSetupGateway, {
  get: (organizationId) =>
    Effect.tryPromise({
      try: async () => {
        const [orgs, resources, services] = await Promise.all([
          database
            .select({ mode: organization.bookingMode })
            .from(organization)
            .where(eq(organization.id, organizationId)),
          database
            .select({
              id: bookable_resource.id,
              name: bookable_resource.name,
              kind: bookable_resource.kind,
              capacity: bookable_resource.capacity,
              active: bookable_resource.active,
            })
            .from(bookable_resource)
            .where(eq(bookable_resource.organizationId, organizationId))
            .orderBy(
              asc(bookable_resource.createdAt),
              asc(bookable_resource.id),
            ),
          database
            .select({
              id: bookable_service.id,
              name: bookable_service.name,
              durationMinutes: bookable_service.durationMinutes,
              active: bookable_service.active,
            })
            .from(bookable_service)
            .where(eq(bookable_service.organizationId, organizationId))
            .orderBy(asc(bookable_service.createdAt), asc(bookable_service.id)),
        ]);
        if (!orgs[0]) throw new BookingSetupUnavailable();
        return { mode: orgs[0].mode, resources, services };
      },
      catch: () => new BookingSetupUnavailable(),
    }),
  save: (organizationId, change) =>
    Effect.tryPromise({
      try: async () => {
        if (change.action === "mode") {
          await database
            .update(organization)
            .set({ bookingMode: change.mode })
            .where(eq(organization.id, organizationId));
          return;
        }
        const table =
          change.action === "resource" ? bookable_resource : bookable_service;
        const values =
          change.action === "resource"
            ? {
                name: change.name,
                capacity: change.capacity,
                active: change.active,
              }
            : {
                name: change.name,
                durationMinutes: change.durationMinutes,
                active: change.active,
              };
        if (change.id) {
          const rows = await database
            .update(table)
            .set(values)
            .where(
              and(
                eq(table.organizationId, organizationId),
                eq(table.id, change.id),
                change.action === "resource"
                  ? eq(bookable_resource.kind, change.kind)
                  : undefined,
              ),
            )
            .returning({ id: table.id });
          if (!rows.length) throw new BookingSetupUnavailable();
        } else if (change.action === "resource") {
          await database.insert(bookable_resource).values({
            organizationId,
            name: change.name,
            kind: change.kind,
            capacity: change.capacity,
            active: change.active,
          });
        } else {
          await database.insert(bookable_service).values({
            organizationId,
            name: change.name,
            durationMinutes: change.durationMinutes,
            active: change.active,
          });
        }
      },
      catch: () => new BookingSetupUnavailable(),
    }),
});
