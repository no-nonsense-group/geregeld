import { Context, type Effect } from "effect";

import type { User } from "#/contexts/identity/slices/register/contract";
import type { AuthenticationUnavailable, Unauthenticated } from "./contract";

export interface CurrentUserGatewayService {
  readonly findBySessionToken: (
    token: string,
  ) => Effect.Effect<User, Unauthenticated | AuthenticationUnavailable>;
}

export class CurrentUserGateway extends Context.Tag(
  "@geregeld/identity/CurrentUserGateway",
)<CurrentUserGateway, CurrentUserGatewayService>() {}
