import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";

import { getCookie, setCookie } from "@tanstack/react-start/server";

const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

function identitySessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-geregeld-session"
    : "geregeld-session";
}

export function setIdentitySessionCookie(token: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  setCookie(identitySessionCookieName(), token, {
    httpOnly: true,
    maxAge: sessionLifetimeSeconds,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
  });
}

export function identitySessionExpiresAt(): Date {
  return new Date(Date.now() + sessionLifetimeSeconds * 1000);
}

export function getIdentitySessionToken(): string | undefined {
  return getCookie(identitySessionCookieName());
}

export function identitySessionTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
