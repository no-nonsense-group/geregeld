import { queryOptions } from "@tanstack/react-query";

import { getGreetingFn } from "./functions";

export const greetingQueryOptions = queryOptions({
  queryKey: ["system", "greeting"],
  queryFn: () => getGreetingFn(),
  staleTime: Number.POSITIVE_INFINITY,
});
