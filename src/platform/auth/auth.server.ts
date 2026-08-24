import "@tanstack/react-start/server-only";

import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { pgPool } from "#/platform/database/pg-pool.server";
import { storeDevelopmentRegistrationCode } from "./development-registration-inbox.server";
import { registrationPlugin } from "./registration-plugin.server";

function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }

  return "geregeld-development-only-secret-change-me";
}

const secret = resolveAuthSecret();

export const auth = betterAuth({
  appName: "Geregeld",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret,
  database: pgPool,
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  user: {
    modelName: "identity_user",
  },
  session: {
    modelName: "identity_session",
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  account: {
    modelName: "identity_account",
  },
  verification: {
    modelName: "identity_verification",
  },
  plugins: [
    registrationPlugin({
      secret,
      sendCode: async ({ email, code }) => {
        storeDevelopmentRegistrationCode(email, code);
      },
    }),
    tanstackStartCookies(),
  ],
});
