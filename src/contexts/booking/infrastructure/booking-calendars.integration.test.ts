import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AvailabilityGateway } from "#/contexts/availability/slices/manage-availability/gateway";
import { BookingSetupGateway } from "#/contexts/booking/slices/manage-booking/gateway";
import { OrganizationId } from "#/contexts/organizations/slices/setup-organization/contract";

vi.mock("@tanstack/react-start/server-only", () => ({}));
const testUrl = process.env.DASHBOARD_TEST_DATABASE_URL;
// Explicit opt-in: never connect to the application's configured database in tests.
describe.skipIf(!testUrl)(
  "independent resource calendars in PostgreSQL",
  () => {
    const org = OrganizationId.make(randomUUID());
    const foreignOrg = OrganizationId.make(randomUUID());
    const roomA = randomUUID();
    const roomB = randomUUID();
    const foreignRoom = randomUUID();
    let pool: Pool;
    let availability: typeof AvailabilityGateway.Service;
    let setup: typeof BookingSetupGateway.Service;
    let closeAppPool: () => Promise<void>;
    beforeAll(async () => {
      process.env.DATABASE_URL = testUrl;
      pool = new Pool({ connectionString: testUrl });
      const { PostgresManageAvailabilityLive } = await import(
        "#/contexts/availability/infrastructure/postgres-manage-availability.server"
      );
      const { PostgresBookingSetupLive } = await import(
        "./postgres-booking-setup.server"
      );
      const { pgPool } = await import("#/platform/database/pg-pool.server");
      closeAppPool = () => pgPool.end();
      availability = await Effect.runPromise(
        AvailabilityGateway.pipe(
          Effect.provide(PostgresManageAvailabilityLive),
        ),
      );
      setup = await Effect.runPromise(
        BookingSetupGateway.pipe(Effect.provide(PostgresBookingSetupLive)),
      );
      await pool.query(
        "INSERT INTO organization(id,name,time_zone) VALUES ($1,'Calendar test','Europe/Amsterdam'),($2,'Foreign business','Europe/Amsterdam')",
        [org, foreignOrg],
      );
      await pool.query(
        "INSERT INTO bookable_resource(id,organization_id,name,kind,capacity) VALUES ($1,$2,'Solo','rooms',1),($3,$2,'Band','rooms',8),($4,$5,'Foreign','rooms',2)",
        [roomA, org, roomB, foreignRoom, foreignOrg],
      );
    });
    afterAll(async () => {
      if (pool) {
        await pool.query(
          "DELETE FROM availability_period WHERE organization_id IN ($1,$2)",
          [org, foreignOrg],
        );
        await pool.query(
          "DELETE FROM bookable_resource WHERE organization_id IN ($1,$2)",
          [org, foreignOrg],
        );
        await pool.query("DELETE FROM organization WHERE id IN ($1,$2)", [
          org,
          foreignOrg,
        ]);
        await pool.end();
      }
      await closeAppPool?.();
    });
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
    it("allows equal times across calendars but rejects overlaps within one", async () => {
      for (const resourceId of [undefined, roomA, roomB])
        await Effect.runPromise(
          availability.createPeriod({
            organizationId: org,
            resourceId,
            period,
          }),
        );
      await expect(
        Effect.runPromise(
          availability.createPeriod({
            organizationId: org,
            resourceId: roomA,
            period,
          }),
        ),
      ).rejects.toThrow();
      expect((await overview(roomA)).periods).toHaveLength(1);
      expect((await overview(roomB)).periods).toHaveLength(1);
      expect((await overview()).periods).toHaveLength(1);
    });
    it("replacement, duration settings, updates and deletion stay in one calendar", async () => {
      await Effect.runPromise(
        availability.replaceRange({
          organizationId: org,
          resourceId: roomA,
          from: period.date,
          to: period.date,
          periods: [{ ...period, startMinute: 720, endMinute: 780 }],
        }),
      );
      expect((await overview(roomB)).periods[0].startMinute).toBe(540);
      expect((await overview()).periods[0].startMinute).toBe(540);
      await Effect.runPromise(
        availability.updateDefaultDuration({
          organizationId: org,
          resourceId: roomA,
          minutes: 120,
        }),
      );
      expect((await overview(roomA)).defaultDurationMinutes).toBe(120);
      expect((await overview(roomB)).defaultDurationMinutes).toBe(60);
      const target = (await overview(roomA)).periods[0];
      await expect(
        Effect.runPromise(
          availability.updatePeriod({
            organizationId: org,
            resourceId: roomB,
            id: target.id,
            period: { ...period, startMinute: 800, endMinute: 860 },
          }),
        ),
      ).rejects.toThrow();
      await expect(
        Effect.runPromise(
          availability.deletePeriod({
            organizationId: org,
            resourceId: roomB,
            id: target.id,
          }),
        ),
      ).rejects.toThrow();
      await Effect.runPromise(
        availability.deletePeriod({
          organizationId: org,
          resourceId: roomA,
          id: target.id,
        }),
      );
      expect((await overview(roomA)).periods).toHaveLength(0);
      expect((await overview(roomB)).periods).toHaveLength(1);
    });
    it("rejects foreign resource access and changes", async () => {
      await expect(overview(foreignRoom)).rejects.toThrow();
      await expect(
        Effect.runPromise(
          availability.createPeriod({
            organizationId: org,
            resourceId: foreignRoom,
            period,
          }),
        ),
      ).rejects.toThrow();
      await expect(
        Effect.runPromise(
          availability.replaceRange({
            organizationId: org,
            resourceId: foreignRoom,
            from: period.date,
            to: period.date,
            periods: [period],
          }),
        ),
      ).rejects.toThrow();
      await expect(
        Effect.runPromise(
          setup.save(org, {
            action: "resource",
            id: foreignRoom,
            kind: "rooms",
            name: "Hijacked",
            capacity: 1,
            active: true,
          }),
        ),
      ).rejects.toThrow();
    });
    it("keeps services, resources and hours when changing style or pausing", async () => {
      await Effect.runPromise(
        setup.save(org, {
          action: "service",
          name: "First consultation",
          durationMinutes: 45,
          active: true,
        }),
      );
      await Effect.runPromise(
        setup.save(org, {
          action: "resource",
          id: roomB,
          kind: "rooms",
          name: "Band",
          capacity: 8,
          active: false,
        }),
      );
      for (const mode of ["appointments", "tables", "rooms"] as const)
        await Effect.runPromise(setup.save(org, { action: "mode", mode }));
      const saved = await Effect.runPromise(setup.get(org));
      expect(saved.mode).toBe("rooms");
      expect(saved.services[0].name).toBe("First consultation");
      expect(saved.resources.find((item) => item.id === roomB)?.active).toBe(
        false,
      );
      expect((await overview(roomB)).periods).toHaveLength(1);
    });
  },
);
