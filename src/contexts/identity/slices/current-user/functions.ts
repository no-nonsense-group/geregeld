import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import {
  clearIdentitySessionCookie,
  getIdentitySessionToken,
} from "#/platform/auth/session.server";
import { appRuntime } from "#/platform/runtime/app-runtime.server";
import { endCurrentSession } from "./workflow";

export const signOutFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const sessionToken = getIdentitySessionToken();
    const result = await appRuntime.runPromise(
      endCurrentSession(sessionToken).pipe(
        Effect.match({
          onFailure: () => ({ ok: false as const }),
          onSuccess: () => ({ ok: true as const }),
        }),
      ),
    );

    clearIdentitySessionCookie();
    return result;
  },
);
