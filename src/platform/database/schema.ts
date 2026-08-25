import * as pgSchema from "./schema.pg";
import * as sqliteSchema from "./schema.sqlite";

export const isSqlite =
  process.env.DATABASE_URL?.startsWith("file:") === true ||
  process.env.SQLITE_PATH !== undefined;

const activeSchema = (
  isSqlite ? sqliteSchema : pgSchema
) as unknown as typeof pgSchema;

export const identity_user = activeSchema.identity_user;
export const identity_session = activeSchema.identity_session;
export const identity_registration_challenge =
  activeSchema.identity_registration_challenge;
export const identity_login_challenge = activeSchema.identity_login_challenge;
export const organization = activeSchema.organization;
export const availability_period = activeSchema.availability_period;
export const organization_membership = activeSchema.organization_membership;

export const identity_userRelations = activeSchema.identity_userRelations;
export const identity_sessionRelations = activeSchema.identity_sessionRelations;
export const organizationRelations = activeSchema.organizationRelations;
export const availability_periodRelations =
  activeSchema.availability_periodRelations;
export const organization_membershipRelations =
  activeSchema.organization_membershipRelations;
