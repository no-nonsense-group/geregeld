import "@tanstack/react-start/server-only";

import { setCookie } from "@tanstack/react-start/server";

const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

export function setIdentitySessionCookie(token: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  setCookie(
    isProduction ? "__Host-geregeld-session" : "geregeld-session",
    token,
    {
      httpOnly: true,
      maxAge: sessionLifetimeSeconds,
      path: "/",
      sameSite: "lax",
      secure: isProduction,
    },
  );
}

export function identitySessionExpiresAt(): Date {
  return new Date(Date.now() + sessionLifetimeSeconds * 1000);
}
