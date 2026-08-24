import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const identity_user = pgTable("identity_user", {
  id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
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
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => identity_user.id, { onDelete: "cascade" }),
  },
  (table) => [index("identity_session_userId_idx").on(table.userId)],
);

export const identity_account = pgTable(
  "identity_account",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => identity_user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("identity_account_issuer_accountId_uidx").on(
      table.issuer,
      table.accountId,
    ),
    index("identity_account_userId_idx").on(table.userId),
  ],
);

export const identity_verification = pgTable(
  "identity_verification",
  {
    id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("identity_verification_identifier_idx").on(table.identifier),
  ],
);

export const identity_userRelations = relations(identity_user, ({ many }) => ({
  identity_sessions: many(identity_session),
  identity_accounts: many(identity_account),
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

export const identity_accountRelations = relations(
  identity_account,
  ({ one }) => ({
    identity_user: one(identity_user, {
      fields: [identity_account.userId],
      references: [identity_user.id],
    }),
  }),
);
