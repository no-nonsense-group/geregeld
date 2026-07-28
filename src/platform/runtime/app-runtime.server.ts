import "@tanstack/react-start/server-only";

import { Layer, ManagedRuntime } from "effect";

const AppLayer = Layer.empty;

export const appRuntime = ManagedRuntime.make(AppLayer);
