import "@tanstack/react-start/server-only";

import {
  and,
  asc,
  between,
  count,
  eq,
  gt,
  isNull,
  lt,
  ne,
  or,
} from "drizzle-orm";
import { Effect, Layer } from "effect";

import {
  AvailabilityConflict,
  AvailabilityNotFound,
  AvailabilityUnavailable,
} from "#/contexts/availability/slices/manage-availability/contract";
import { AvailabilityGateway } from "#/contexts/availability/slices/manage-availability/gateway";
import { database } from "#/platform/database/drizzle.server";
import {
  availability_period,
  bookable_resource,
  organization,
} from "#/platform/database/schema";

import { acquireOrganizationLock } from "#/platform/database/write-lock.server";

function scopeFilter(input: { organizationId: string; resourceId?: string }) {
  return and(
    eq(availability_period.organizationId, input.organizationId),
    input.resourceId
      ? eq(availability_period.resourceId, input.resourceId)
      : isNull(availability_period.resourceId),
  );
}

// Both settings and ownership are resolved for the selected calendar.
async function settingsFor(
  input: {
    organizationId: string;
    resourceId?: string;
  },
  connection: Pick<typeof database, "select"> = database,
) {
  const rows = input.resourceId
    ? await connection
        .select({
          configuredAt: bookable_resource.availabilityConfiguredAt,
          defaultDurationMinutes: bookable_resource.defaultDurationMinutes,
        })
        .from(bookable_resource)
        .where(
          and(
            eq(bookable_resource.id, input.resourceId),
            eq(bookable_resource.organizationId, input.organizationId),
          ),
        )
        .limit(1)
    : await connection
        .select({
          configuredAt: organization.availabilityConfiguredAt,
          defaultDurationMinutes: organization.defaultAvailabilityPeriodMinutes,
        })
        .from(organization)
        .where(eq(organization.id, input.organizationId))
        .limit(1);
  if (!rows[0]) throw new AvailabilityUnavailable();
  return rows[0];
}

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
          const settings = await settingsFor(input);

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
                  scopeFilter(input),
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
              .where(and(scopeFilter(input), isFuture)),
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
          await settingsFor(input);
          if (input.resourceId) {
            await database
              .update(bookable_resource)
              .set({ defaultDurationMinutes: input.minutes })
              .where(
                and(
                  eq(bookable_resource.id, input.resourceId),
                  eq(bookable_resource.organizationId, input.organizationId),
                ),
              );
          } else {
            await database
              .update(organization)
              .set({ defaultAvailabilityPeriodMinutes: input.minutes })
              .where(eq(organization.id, input.organizationId));
          }
        },
        catch: () => new AvailabilityUnavailable(),
      }),
    replaceRange: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await settingsFor(input, transaction);
            await acquireOrganizationLock(transaction, input.organizationId);
            await transaction
              .delete(availability_period)
              .where(
                and(
                  scopeFilter(input),
                  between(availability_period.date, input.from, input.to),
                ),
              );

            if (input.periods.length > 0) {
              await transaction.insert(availability_period).values(
                input.periods.map((period) => ({
                  organizationId: input.organizationId,
                  resourceId: input.resourceId,
                  date: period.date,
                  startMinute: period.startMinute,
                  endMinute: period.endMinute,
                })),
              );
              if (input.resourceId) {
                await transaction
                  .update(bookable_resource)
                  .set({ availabilityConfiguredAt: new Date() })
                  .where(
                    and(
                      eq(bookable_resource.id, input.resourceId),
                      eq(
                        bookable_resource.organizationId,
                        input.organizationId,
                      ),
                    ),
                  );
              } else {
                await transaction
                  .update(organization)
                  .set({ availabilityConfiguredAt: new Date() })
                  .where(eq(organization.id, input.organizationId));
              }
            }
          }),
        catch: () => new AvailabilityUnavailable(),
      }),
    createPeriod: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await settingsFor(input, transaction);
            await acquireOrganizationLock(transaction, input.organizationId);
            const overlaps = await transaction
              .select({ id: availability_period.id })
              .from(availability_period)
              .where(
                and(
                  scopeFilter(input),
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
                resourceId: input.resourceId,
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

            if (input.resourceId) {
              await transaction
                .update(bookable_resource)
                .set({ availabilityConfiguredAt: new Date() })
                .where(
                  and(
                    eq(bookable_resource.id, input.resourceId),
                    eq(bookable_resource.organizationId, input.organizationId),
                  ),
                );
            } else {
              await transaction
                .update(organization)
                .set({ availabilityConfiguredAt: new Date() })
                .where(eq(organization.id, input.organizationId));
            }
            return created;
          }),
        catch: mapCreateError,
      }),
    updatePeriod: (input) =>
      Effect.tryPromise({
        try: () =>
          database.transaction(async (transaction) => {
            await settingsFor(input, transaction);
            await acquireOrganizationLock(transaction, input.organizationId);
            const overlaps = await transaction
              .select({ id: availability_period.id })
              .from(availability_period)
              .where(
                and(
                  scopeFilter(input),
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
                and(eq(availability_period.id, input.id), scopeFilter(input)),
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
          await settingsFor(input);
          const deleted = await database
            .delete(availability_period)
            .where(
              and(eq(availability_period.id, input.id), scopeFilter(input)),
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
