import "@tanstack/react-start/server-only";

import { and, asc, between, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  AvailabilityNotFound,
  AvailabilityUnavailable,
} from "#/contexts/availability/slices/manage-availability/contract";
import { AvailabilityGateway } from "#/contexts/availability/slices/manage-availability/gateway";
import { database } from "#/platform/database/drizzle.server";
import {
  booking_hours_date_exception,
  booking_hours_date_exception_window,
  booking_hours_window,
  organization,
} from "#/platform/database/schema";
import { acquireOrganizationLock } from "#/platform/database/write-lock.server";

function unavailable() {
  return new AvailabilityUnavailable();
}

export const PostgresManageAvailabilityLive = Layer.succeed(
  AvailabilityGateway,
  {
    getConfiguration: (input) =>
      Effect.tryPromise({
        try: async () => {
          const [settings] = await database
            .select({ configuredAt: organization.availabilityConfiguredAt })
            .from(organization)
            .where(eq(organization.id, input.organizationId))
            .limit(1);

          if (!settings) {
            throw new AvailabilityUnavailable();
          }

          const [weeklyHours, exceptions, exceptionWindows] = await Promise.all(
            [
              database
                .select({
                  id: booking_hours_window.id,
                  dayOfWeek: booking_hours_window.dayOfWeek,
                  startMinute: booking_hours_window.startMinute,
                  endMinute: booking_hours_window.endMinute,
                })
                .from(booking_hours_window)
                .where(
                  eq(booking_hours_window.organizationId, input.organizationId),
                )
                .orderBy(
                  asc(booking_hours_window.dayOfWeek),
                  asc(booking_hours_window.startMinute),
                ),
              database
                .select({
                  id: booking_hours_date_exception.id,
                  date: booking_hours_date_exception.date,
                })
                .from(booking_hours_date_exception)
                .where(
                  and(
                    eq(
                      booking_hours_date_exception.organizationId,
                      input.organizationId,
                    ),
                    between(
                      booking_hours_date_exception.date,
                      input.from,
                      input.to,
                    ),
                  ),
                )
                .orderBy(asc(booking_hours_date_exception.date)),
              database
                .select({
                  exceptionId: booking_hours_date_exception_window.exceptionId,
                  startMinute: booking_hours_date_exception_window.startMinute,
                  endMinute: booking_hours_date_exception_window.endMinute,
                })
                .from(booking_hours_date_exception_window)
                .innerJoin(
                  booking_hours_date_exception,
                  eq(
                    booking_hours_date_exception_window.exceptionId,
                    booking_hours_date_exception.id,
                  ),
                )
                .where(
                  and(
                    eq(
                      booking_hours_date_exception.organizationId,
                      input.organizationId,
                    ),
                    between(
                      booking_hours_date_exception.date,
                      input.from,
                      input.to,
                    ),
                  ),
                )
                .orderBy(
                  asc(booking_hours_date_exception.date),
                  asc(booking_hours_date_exception_window.startMinute),
                ),
            ],
          );

          return {
            configured: settings.configuredAt !== null,
            weeklyHours,
            dateExceptions: exceptions.map((exception) => ({
              ...exception,
              windows: exceptionWindows
                .filter((window) => window.exceptionId === exception.id)
                .map(({ startMinute, endMinute }) => ({
                  startMinute,
                  endMinute,
                })),
            })),
          };
        },
        catch: unavailable,
      }),
    replaceWeeklyHours: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await acquireOrganizationLock(transaction, input.organizationId);
            await transaction
              .delete(booking_hours_window)
              .where(
                eq(booking_hours_window.organizationId, input.organizationId),
              );

            if (input.windows.length > 0) {
              await transaction.insert(booking_hours_window).values(
                input.windows.map((window) => ({
                  organizationId: input.organizationId,
                  dayOfWeek: window.dayOfWeek,
                  startMinute: window.startMinute,
                  endMinute: window.endMinute,
                })),
              );
            }

            await transaction
              .update(organization)
              .set({ availabilityConfiguredAt: new Date() })
              .where(eq(organization.id, input.organizationId));
          }),
        catch: unavailable,
      }),
    upsertDateException: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await acquireOrganizationLock(transaction, input.organizationId);
            const [exception] = await transaction
              .insert(booking_hours_date_exception)
              .values({
                organizationId: input.organizationId,
                date: input.date,
              })
              .onConflictDoUpdate({
                target: [
                  booking_hours_date_exception.organizationId,
                  booking_hours_date_exception.date,
                ],
                set: { updatedAt: new Date() },
              })
              .returning({ id: booking_hours_date_exception.id });

            if (!exception) {
              throw new AvailabilityUnavailable();
            }

            await transaction
              .delete(booking_hours_date_exception_window)
              .where(
                eq(
                  booking_hours_date_exception_window.exceptionId,
                  exception.id,
                ),
              );

            if (input.windows.length > 0) {
              await transaction
                .insert(booking_hours_date_exception_window)
                .values(
                  input.windows.map((window) => ({
                    exceptionId: exception.id,
                    startMinute: window.startMinute,
                    endMinute: window.endMinute,
                  })),
                );
            }

            await transaction
              .update(organization)
              .set({ availabilityConfiguredAt: new Date() })
              .where(eq(organization.id, input.organizationId));

            return {
              id: exception.id,
              date: input.date,
              windows: input.windows,
            };
          }),
        catch: unavailable,
      }),
    deleteDateException: (input) =>
      Effect.tryPromise({
        try: async () => {
          const deleted = await database
            .delete(booking_hours_date_exception)
            .where(
              and(
                eq(
                  booking_hours_date_exception.organizationId,
                  input.organizationId,
                ),
                eq(booking_hours_date_exception.date, input.date),
              ),
            )
            .returning({ id: booking_hours_date_exception.id });

          if (deleted.length === 0) {
            throw new AvailabilityNotFound();
          }
        },
        catch: (error) =>
          error instanceof AvailabilityNotFound ? error : unavailable(),
      }),
  },
);
