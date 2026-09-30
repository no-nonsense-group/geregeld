import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { Effect } from "effect";
import { expect, it, vi } from "vitest";
import { AvailabilityGateway } from "#/contexts/availability/slices/manage-availability/gateway";
import { BookingSetupGateway } from "#/contexts/booking/slices/manage-booking/gateway";
import { UserId } from "#/contexts/identity/slices/register/contract";
import { ManageOrganizationGateway } from "#/contexts/organizations/slices/manage-organization/gateway";
import {
  IanaTimeZone,
  OrganizationId,
  OrganizationName,
} from "#/contexts/organizations/slices/setup-organization/contract";

vi.mock("@tanstack/react-start/server-only", () => ({}));

it("migrates SQLite and supports resource calendars plus business settings", async () => {
  const directory = await mkdtemp(join(tmpdir(), "geregeld-sqlite-test-"));
  const savedUrl = process.env.DATABASE_URL;
  const savedPath = process.env.SQLITE_PATH;
  process.env.DATABASE_URL = `file:${join(directory, "test.db")}`;
  delete process.env.SQLITE_PATH;
  let appClient: Client | undefined;
  try {
    const migrationClient = createClient({ url: process.env.DATABASE_URL });
    try {
      await migrate(drizzle(migrationClient), {
        migrationsFolder: "drizzle/sqlite",
      });
    } finally {
      migrationClient.close();
    }
    const { database } = await import("#/platform/database/drizzle.server");
    const schema = await import("#/platform/database/schema");
    expect(schema.isSqlite).toBe(true);
    appClient = (database as unknown as { $client: Client }).$client;
    const { PostgresManageAvailabilityLive } = await import(
      "#/contexts/availability/infrastructure/postgres-manage-availability.server"
    );
    const { PostgresBookingSetupLive } = await import(
      "./postgres-booking-setup.server"
    );
    const { PostgresManageOrganizationLive } = await import(
      "#/contexts/organizations/infrastructure/postgres-manage-organization.server"
    );
    const availability = await Effect.runPromise(
      AvailabilityGateway.pipe(Effect.provide(PostgresManageAvailabilityLive)),
    );
    const setup = await Effect.runPromise(
      BookingSetupGateway.pipe(Effect.provide(PostgresBookingSetupLive)),
    );
    const settings = await Effect.runPromise(
      ManageOrganizationGateway.pipe(
        Effect.provide(PostgresManageOrganizationLive),
      ),
    );
    const [owner] = await database
      .insert(schema.identity_user)
      .values({ email: "sqlite-test@example.com" })
      .returning();
    const organizations = await database
      .insert(schema.organization)
      .values([
        { name: "Studio", timeZone: "Europe/Amsterdam" },
        { name: "Other studio", timeZone: "Europe/Amsterdam" },
      ])
      .returning();
    const org = OrganizationId.make(organizations[0].id);
    const otherOrg = OrganizationId.make(organizations[1].id);
    await database
      .insert(schema.organization_membership)
      .values({ userId: owner.id, organizationId: org });
    await Effect.runPromise(setup.save(org, { action: "mode", mode: "rooms" }));
    await Effect.runPromise(
      setup.save(org, {
        action: "service",
        name: "First consultation",
        durationMinutes: 45,
        active: true,
      }),
    );
    for (const name of ["Solo", "Band"])
      await Effect.runPromise(
        setup.save(org, {
          action: "resource",
          name,
          kind: "rooms",
          capacity: name === "Solo" ? 1 : 8,
          active: true,
        }),
      );
    const offer = await Effect.runPromise(setup.get(org));
    expect(offer.mode).toBe("rooms");
    expect(offer.services[0].durationMinutes).toBe(45);
    expect(offer.resources).toHaveLength(2);
    const [a, b] = offer.resources;
    const period = { date: "2090-01-02", startMinute: 540, endMinute: 600 };
    const overview = (resourceId?: string) =>
      Effect.runPromise(
        availability.getOverview({
          organizationId: org,
          resourceId,
          today: "2090-01-01",
          currentMinute: 0,
          from: "2090-01-01",
          to: "2090-01-07",
        }),
      );
    for (const resourceId of [undefined, a.id, b.id])
      await Effect.runPromise(
        availability.createPeriod({ organizationId: org, resourceId, period }),
      );
    await expect(
      Effect.runPromise(
        availability.createPeriod({
          organizationId: org,
          resourceId: a.id,
          period,
        }),
      ),
    ).rejects.toThrow();
    await expect(
      Effect.runPromise(
        availability.createPeriod({
          organizationId: otherOrg,
          resourceId: a.id,
          period,
        }),
      ),
    ).rejects.toThrow();
    await Effect.runPromise(
      availability.replaceRange({
        organizationId: org,
        resourceId: a.id,
        from: period.date,
        to: period.date,
        periods: [{ ...period, startMinute: 720, endMinute: 780 }],
      }),
    );
    expect((await overview(a.id)).periods[0].startMinute).toBe(720);
    expect((await overview(b.id)).periods[0].startMinute).toBe(540);
    expect((await overview()).periods[0].startMinute).toBe(540);
    await Effect.runPromise(
      availability.updateDefaultDuration({
        organizationId: org,
        resourceId: a.id,
        minutes: 120,
      }),
    );
    expect((await overview(a.id)).defaultDurationMinutes).toBe(120);
    expect((await overview(b.id)).defaultDurationMinutes).toBe(60);
    const target = (await overview(a.id)).periods[0];
    await Effect.runPromise(
      availability.updatePeriod({
        organizationId: org,
        resourceId: a.id,
        id: target.id,
        period: { ...period, startMinute: 780, endMinute: 840 },
      }),
    );
    await expect(
      Effect.runPromise(
        availability.deletePeriod({
          organizationId: org,
          resourceId: b.id,
          id: target.id,
        }),
      ),
    ).rejects.toThrow();
    await Effect.runPromise(
      availability.deletePeriod({
        organizationId: org,
        resourceId: a.id,
        id: target.id,
      }),
    );
    expect((await overview(a.id)).periods).toHaveLength(0);
    const changed = await Effect.runPromise(
      settings.updateForUser({
        userId: UserId.make(owner.id),
        name: OrganizationName.make("Updated studio"),
        timeZone: IanaTimeZone.make("Europe/Amsterdam"),
      }),
    );
    expect(changed.name).toBe("Updated studio");
    await Effect.runPromise(settings.deleteForUser(UserId.make(owner.id)));
    expect(
      await database
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, org)),
    ).toHaveLength(0);
    expect(await database.select().from(schema.bookable_resource)).toHaveLength(
      0,
    );
    expect(
      await database.select().from(schema.availability_period),
    ).toHaveLength(0);
    expect(
      await database
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, otherOrg)),
    ).toHaveLength(1);
  } finally {
    appClient?.close();
    if (savedUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = savedUrl;
    if (savedPath === undefined) delete process.env.SQLITE_PATH;
    else process.env.SQLITE_PATH = savedPath;
    await rm(directory, { recursive: true, force: true });
  }
}, 15000);
