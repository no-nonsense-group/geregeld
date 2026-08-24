import { createServerFn } from "@tanstack/react-start";

import { appRuntime } from "#/platform/runtime/app-runtime.server";
import { getGreeting } from "./workflow";

export const getGreetingFn = createServerFn({ method: "GET" }).handler(() =>
  appRuntime.runPromise(getGreeting),
);
