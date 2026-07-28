import { expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { getGreeting } from "./workflow";

it.effect("returns a greeting", () =>
	Effect.gen(function* () {
		const greeting = yield* getGreeting;

		expect(greeting).toEqual({
			message: "Hello, world.",
		});
	}),
);
