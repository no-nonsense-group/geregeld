import "@tanstack/react-start/server-only";

import { and, asc, between, count, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  AvailabilityConflict,
  AvailabilityNotFound,
  AvailabilityUnavailable,
} from "#/contexts/availability/slices/manage-availability/contract";
import { AvailabilityGateway } from "#/contexts/availability/slices/manage-availability/gateway";
import { database } from "#/platform/database/drizzle.server";
import { availability_period, organization } from "#/platform/database/schema";

function mapCreateError(error: unknown) {
  return error instanceof AvailabilityConflict
    ? error
    : new AvailabilityUnavailable();
}

function mapUpdateError(error: unknown) {
  if (
    error instanceof AvailabilityConflict ||
    error instanceof AvailabilityNotFound
  ) {
    return error;
  }

  return new AvailabilityUnavailable();
}

function mapDeleteError(error: unknown) {
  return error instanceof AvailabilityNotFound
    ? error
    : new AvailabilityUnavailable();
}

export const PostgresManageAvailabilityLive = Layer.succeed(
  AvailabilityGateway,
  {
    getOverview: (input) =>
      Effect.tryPromise({
        try: async () => {
          const [settings] = await database
            .select({
              configuredAt: organization.availabilityConfiguredAt,
              defaultDurationMinutes:
                organization.defaultAvailabilityPeriodMinutes,
            })
            .from(organization)
            .where(eq(organization.id, input.organizationId))
            .limit(1);

          if (!settings) {
            throw new AvailabilityUnavailable();
          }

          const isFuture = or(
            gt(availability_period.date, input.today),
            and(
              eq(availability_period.date, input.today),
              gt(availability_period.startMinute, input.currentMinute),
            ),
          );
          const [periods, totals] = await Promise.all([
            database
              .select({
                id: availability_period.id,
                date: availability_period.date,
                startMinute: availability_period.startMinute,
                endMinute: availability_period.endMinute,
              })
              .from(availability_period)
              .where(
                and(
                  eq(availability_period.organizationId, input.organizationId),
                  between(availability_period.date, input.from, input.to),
                  isFuture,
                ),
              )
              .orderBy(
                asc(availability_period.date),
                asc(availability_period.startMinute),
              ),
            database
              .select({ value: count() })
              .from(availability_period)
              .where(
                and(
                  eq(availability_period.organizationId, input.organizationId),
                  isFuture,
                ),
              ),
          ]);

          return {
            configured: settings.configuredAt !== null,
            defaultDurationMinutes: settings.defaultDurationMinutes,
            localToday: input.today,
            rangeFrom: input.from,
            rangeTo: input.to,
            totalFuturePeriods: totals[0]?.value ?? 0,
            periods,
          };
        },
        catch: () => new AvailabilityUnavailable(),
      }),
    updateDefaultDuration: (input) =>
      Effect.tryPromise({
        try: async () => {
          const updated = await database
            .update(organization)
            .set({ defaultAvailabilityPeriodMinutes: input.minutes })
            .where(eq(organization.id, input.organizationId))
            .returning({ id: organization.id });

          if (updated.length === 0) {
            throw new AvailabilityUnavailable();
          }
        },
        catch: () => new AvailabilityUnavailable(),
      }),
    replaceRange: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await transaction.execute(
              sql`select pg_advisory_xact_lock(hashtextextended(${input.organizationId}, 0))`,
            );
            await transaction
              .delete(availability_period)
              .where(
                and(
                  eq(availability_period.organizationId, input.organizationId),
                  between(availability_period.date, input.from, input.to),
                ),
              );

            if (input.periods.length > 0) {
              await transaction.insert(availability_period).values(
                input.periods.map((period) => ({
                  organizationId: input.organizationId,
                  date: period.date,
                  startMinute: period.startMinute,
                  endMinute: period.endMinute,
                })),
              );
              await transaction
                .update(organization)
                .set({ availabilityConfiguredAt: new Date() })
                .where(eq(organization.id, input.organizationId));
            }
          }),
        catch: () => new AvailabilityUnavailable(),
      }),
    createPeriod: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await transaction.execute(
              sql`select pg_advisory_xact_lock(hashtextextended(${input.organizationId}, 0))`,
            );
            const overlaps = await transaction
              .select({ id: availability_period.id })
              .from(availability_period)
              .where(
                and(
                  eq(availability_period.organizationId, input.organizationId),
                  eq(availability_period.date, input.period.date),
                  lt(availability_period.startMinute, input.period.endMinute),
                  gt(availability_period.endMinute, input.period.startMinute),
                ),
              )
              .limit(1);
            if (overlaps.length > 0) {
              throw new AvailabilityConflict();
            }

            const [created] = await transaction
              .insert(availability_period)
              .values({
                organizationId: input.organizationId,
                date: input.period.date,
                startMinute: input.period.startMinute,
                endMinute: input.period.endMinute,
              })
              .returning({
                id: availability_period.id,
                date: availability_period.date,
                startMinute: availability_period.startMinute,
                endMinute: availability_period.endMinute,
              });
            if (!created) {
              throw new AvailabilityUnavailable();
            }

            await transaction
              .update(organization)
              .set({ availabilityConfiguredAt: new Date() })
              .where(eq(organization.id, input.organizationId));
            return created;
          }),
        catch: mapCreateError,
      }),
    updatePeriod: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await transaction.execute(
              sql`select pg_advisory_xact_lock(hashtextextended(${input.organizationId}, 0))`,
            );
            const overlaps = await transaction
              .select({ id: availability_period.id })
              .from(availability_period)
              .where(
                and(
                  eq(availability_period.organizationId, input.organizationId),
                  eq(availability_period.date, input.period.date),
                  ne(availability_period.id, input.id),
                  lt(availability_period.startMinute, input.period.endMinute),
                  gt(availability_period.endMinute, input.period.startMinute),
                ),
              )
              .limit(1);
            if (overlaps.length > 0) {
              throw new AvailabilityConflict();
            }

            const [updated] = await transaction
              .update(availability_period)
              .set({
                date: input.period.date,
                startMinute: input.period.startMinute,
                endMinute: input.period.endMinute,
              })
              .where(
                and(
                  eq(availability_period.id, input.id),
                  eq(availability_period.organizationId, input.organizationId),
                ),
              )
              .returning({
                id: availability_period.id,
                date: availability_period.date,
                startMinute: availability_period.startMinute,
                endMinute: availability_period.endMinute,
              });
            if (!updated) {
              throw new AvailabilityNotFound();
            }

            return updated;
          }),
        catch: mapUpdateError,
      }),
    deletePeriod: (input) =>
      Effect.tryPromise({
        try: async () => {
          const deleted = await database
            .delete(availability_period)
            .where(
              and(
                eq(availability_period.id, input.id),
                eq(availability_period.organizationId, input.organizationId),
              ),
            )
            .returning({ id: availability_period.id });
          if (deleted.length === 0) {
            throw new AvailabilityNotFound();
          }
        },
        catch: mapDeleteError,
      }),
  },
);
