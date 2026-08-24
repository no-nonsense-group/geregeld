import "@tanstack/react-start/server-only";

import { dash, sendEmail } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { database } from "#/platform/database/drizzle.server";
import * as schema from "#/platform/database/schema";
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

function resolveAuthBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  const vercelHostname =
    process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelHostname) {
    return `https://${vercelHostname}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_URL is required outside Vercel production");
  }

  return "http://localhost:3000";
}

const secret = resolveAuthSecret();
const baseURL = resolveAuthBaseUrl();

async function sendRegistrationCode(input: {
  readonly email: string;
  readonly code: string;
}): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    storeDevelopmentRegistrationCode(input.email, input.code);
    return;
  }

  const result = await sendEmail(
    {
      template: "verify-email-otp",
      to: input.email,
      variables: {
        otpCode: input.code,
        userEmail: input.email,
        appName: "Geregeld",
        expirationMinutes: "5",
      },
    },
    {
      apiKey: process.env.BETTER_AUTH_API_KEY,
      apiUrl: process.env.BETTER_AUTH_API_URL,
    },
  );

  if (!result.success) {
    throw new Error(`Registration email failed: ${result.error}`);
  }
}

export const auth = betterAuth({
  appName: "Geregeld",
  baseURL,
  secret,
  database: drizzleAdapter(database, {
    provider: "pg",
    schema,
  }),
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
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
    registrationPlugin({
      secret,
      sendCode: sendRegistrationCode,
    }),
    tanstackStartCookies(),
  ],
});
