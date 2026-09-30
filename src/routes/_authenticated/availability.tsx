import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/availability")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/dashboard", search: { lang: search.lang } });
  },
});
