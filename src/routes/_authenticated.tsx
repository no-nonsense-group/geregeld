import { createFileRoute, redirect } from "@tanstack/react-router";

import { getOrganizationContextFn } from "#/contexts/organizations/slices/setup-organization/functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ search }) => {
    const organizationContext = await getOrganizationContextFn();

    if (organizationContext.status === "unauthenticated") {
      throw redirect({ to: "/login", search: { lang: search.lang } });
    }

    return { organizationContext };
  },
});
