import { Effect } from "effect";

import type { Greeting } from "./contract";

export const getGreeting: Effect.Effect<Greeting> = Effect.succeed({
	message: "Hello, world.",
});
