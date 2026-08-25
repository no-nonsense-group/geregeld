import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const identity_user = pgTable("identity_user", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  termsVersion: text("terms_version"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const identity_session = pgTable(
  "identity_session",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => identity_user.id, { onDelete: "cascade" }),
  },
  (table) => [index("identity_session_userId_idx").on(table.userId)],
);

export const identity_registration_challenge = pgTable(
  "identity_registration_challenge",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    email: text("email").notNull().unique(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const identity_login_challenge = pgTable("identity_login_challenge", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  email: text("email").notNull().unique(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organization_membership_role = pgEnum(
  "organization_membership_role",
  ["owner"],
);

export const organization = pgTable("organization", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  name: text("name").notNull(),
  timeZone: text("time_zone").notNull(),
  availabilityConfiguredAt: timestamp("availability_configured_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const booking_hours_window = pgTable(
  "booking_hours_window",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("booking_hours_window_organization_day_idx").on(
      table.organizationId,
      table.dayOfWeek,
    ),
    check(
      "booking_hours_window_day_of_week_check",
      sql`${table.dayOfWeek} >= 0 AND ${table.dayOfWeek} <= 6`,
    ),
    check(
      "booking_hours_window_start_minute_check",
      sql`${table.startMinute} >= 0 AND ${table.startMinute} < 1440`,
    ),
    check(
      "booking_hours_window_end_minute_check",
      sql`${table.endMinute} > 0 AND ${table.endMinute} <= 1440`,
    ),
    check(
      "booking_hours_window_order_check",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
    uniqueIndex("booking_hours_window_unique").on(
      table.organizationId,
      table.dayOfWeek,
      table.startMinute,
      table.endMinute,
    ),
  ],
);

export const booking_hours_date_exception = pgTable(
  "booking_hours_date_exception",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("booking_hours_date_exception_organization_date_uidx").on(
      table.organizationId,
      table.date,
    ),
    check(
      "booking_hours_date_exception_date_limit_check",
      sql`${table.date} <= DATE '2099-12-31'`,
    ),
  ],
);

export const booking_hours_date_exception_window = pgTable(
  "booking_hours_date_exception_window",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    exceptionId: uuid("exception_id")
      .notNull()
      .references(() => booking_hours_date_exception.id, {
        onDelete: "cascade",
      }),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("booking_hours_date_exception_window_exception_idx").on(
      table.exceptionId,
    ),
    check(
      "booking_hours_date_exception_window_start_minute_check",
      sql`${table.startMinute} >= 0 AND ${table.startMinute} < 1440`,
    ),
    check(
      "booking_hours_date_exception_window_end_minute_check",
      sql`${table.endMinute} > 0 AND ${table.endMinute} <= 1440`,
    ),
    check(
      "booking_hours_date_exception_window_order_check",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
  ],
);

export const organization_membership = pgTable(
  "organization_membership",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    role: organization_membership_role("role").default("owner").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => identity_user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("organization_membership_userId_uidx").on(table.userId),
    uniqueIndex("organization_membership_ownerOrganizationId_uidx")
      .on(table.organizationId)
      .where(sql`${table.role} = 'owner'`),
  ],
);

export const identity_userRelations = relations(identity_user, ({ many }) => ({
  identity_sessions: many(identity_session),
  organization_memberships: many(organization_membership),
}));

export const identity_sessionRelations = relations(
  identity_session,
  ({ one }) => ({
    identity_user: one(identity_user, {
      fields: [identity_session.userId],
      references: [identity_user.id],
    }),
  }),
);

export const organizationRelations = relations(organization, ({ many }) => ({
  memberships: many(organization_membership),
  bookingHoursWindows: many(booking_hours_window),
  bookingHoursDateExceptions: many(booking_hours_date_exception),
}));

export const booking_hours_windowRelations = relations(
  booking_hours_window,
  ({ one }) => ({
    organization: one(organization, {
      fields: [booking_hours_window.organizationId],
      references: [organization.id],
    }),
  }),
);

export const booking_hours_date_exceptionRelations = relations(
  booking_hours_date_exception,
  ({ many, one }) => ({
    organization: one(organization, {
      fields: [booking_hours_date_exception.organizationId],
      references: [organization.id],
    }),
    windows: many(booking_hours_date_exception_window),
  }),
);

export const booking_hours_date_exception_windowRelations = relations(
  booking_hours_date_exception_window,
  ({ one }) => ({
    exception: one(booking_hours_date_exception, {
      fields: [booking_hours_date_exception_window.exceptionId],
      references: [booking_hours_date_exception.id],
    }),
  }),
);

export const organization_membershipRelations = relations(
  organization_membership,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organization_membership.organizationId],
      references: [organization.id],
    }),
    user: one(identity_user, {
      fields: [organization_membership.userId],
      references: [identity_user.id],
    }),
  }),
);
