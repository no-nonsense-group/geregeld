import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const identity_user = sqliteTable("identity_user", {
  id: id(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  termsAcceptedAt: integer("terms_accepted_at", { mode: "timestamp" }),
  termsVersion: text("terms_version"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const identity_session = sqliteTable(
  "identity_session",
  {
    id: id(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: createdAt(),
    userId: text("user_id")
      .notNull()
      .references(() => identity_user.id, { onDelete: "cascade" }),
  },
  (table) => [index("identity_session_userId_idx").on(table.userId)],
);

export const identity_registration_challenge = sqliteTable(
  "identity_registration_challenge",
  {
    id: id(),
    email: text("email").notNull().unique(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: createdAt(),
  },
);

export const identity_login_challenge = sqliteTable(
  "identity_login_challenge",
  {
    id: id(),
    email: text("email").notNull().unique(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: createdAt(),
  },
);

export const organization = sqliteTable("organization", {
  id: id(),
  name: text("name").notNull(),
  timeZone: text("time_zone").notNull(),
  availabilityConfiguredAt: integer("availability_configured_at", {
    mode: "timestamp",
  }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const booking_hours_window = sqliteTable(
  "booking_hours_window",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
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

export const booking_hours_date_exception = sqliteTable(
  "booking_hours_date_exception",
  {
    id: id(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("booking_hours_date_exception_organization_date_uidx").on(
      table.organizationId,
      table.date,
    ),
    check(
      "booking_hours_date_exception_date_limit_check",
      sql`${table.date} <= '2099-12-31'`,
    ),
  ],
);

export const booking_hours_date_exception_window = sqliteTable(
  "booking_hours_date_exception_window",
  {
    id: id(),
    exceptionId: text("exception_id")
      .notNull()
      .references(() => booking_hours_date_exception.id, {
        onDelete: "cascade",
      }),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
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

export const organization_membership = sqliteTable(
  "organization_membership",
  {
    id: id(),
    role: text("role", { enum: ["owner"] })
      .default("owner")
      .notNull(),
    createdAt: createdAt(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
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
