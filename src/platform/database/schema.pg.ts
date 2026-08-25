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
  defaultAvailabilityPeriodMinutes: integer(
    "default_availability_period_minutes",
  )
    .default(30)
    .notNull(),
  availabilityConfiguredAt: timestamp("availability_configured_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const availability_period = pgTable(
  "availability_period",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("availability_period_organization_date_idx").on(
      table.organizationId,
      table.date,
    ),
    check(
      "availability_period_start_minute_check",
      sql`${table.startMinute} >= 0 AND ${table.startMinute} < 1440`,
    ),
    check(
      "availability_period_end_minute_check",
      sql`${table.endMinute} > 0 AND ${table.endMinute} <= 1440`,
    ),
    check(
      "availability_period_order_check",
      sql`${table.startMinute} < ${table.endMinute}`,
    ),
    check(
      "availability_period_date_limit_check",
      sql`${table.date} <= DATE '2099-12-31'`,
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
  availabilityPeriods: many(availability_period),
}));

export const availability_periodRelations = relations(
  availability_period,
  ({ one }) => ({
    organization: one(organization, {
      fields: [availability_period.organizationId],
      references: [organization.id],
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
