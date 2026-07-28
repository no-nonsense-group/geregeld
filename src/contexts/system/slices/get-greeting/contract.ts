import { Schema } from "effect";

export const Greeting = Schema.Struct({
	message: Schema.String,
});

export type Greeting = typeof Greeting.Type;
