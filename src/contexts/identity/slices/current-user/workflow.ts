import { Effect } from "effect";

import { Unauthenticated } from "./contract";
import { CurrentUserGateway } from "./gateway";

export function resolveCurrentUser(sessionToken: string | undefined) {
  return Effect.gen(function* () {
    if (!sessionToken) {
      return yield* new Unauthenticated();
    }

    const gateway = yield* CurrentUserGateway;
    return yield* gateway.findBySessionToken(sessionToken);
  }).pipe(Effect.withSpan("identity.resolveCurrentUser"));
}
