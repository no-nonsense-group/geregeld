import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { DashboardWorkspace } from "#/components/dashboard-workspace";
import { organizationCopy } from "#/content/organization";
import { getAvailabilityFn } from "#/contexts/availability/slices/manage-availability/functions";
import { getBookingSetupFn } from "#/contexts/booking/slices/manage-booking/functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ context, deps }) => {
    const state = context.organizationContext;

    if (state.status === "setup-required") {
      throw redirect({ to: "/setup", search: { lang: deps.lang } });
    }

    if (state.status !== "ready") {
      return {
        organization: undefined,
        availability: undefined,
        setup: undefined,
        unavailable: true as const,
      };
    }

    const [availability, setup] = await Promise.all([
      getAvailabilityFn({ data: {} }),
      getBookingSetupFn(),
    ]);
    return {
      organization: state.organization,
      setup: setup.ok ? setup.value : undefined,
      availability: availability.ok ? availability.value : undefined,
      unavailable: false as const,
    };
  },
  head: ({ match }) => {
    const copy = organizationCopy[match.search.lang].dashboard;

    return {
      meta: [
        { title: copy.meta.title },
        { name: "description", content: copy.meta.description },
      ],
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { lang } = Route.useSearch();
  const { organization, availability, setup, unavailable } =
    Route.useLoaderData();
  const router = useRouter();
  if (unavailable || !organization || !setup) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <div className="text-center">
          <p role="alert" className="text-muted-foreground">
            {organizationCopy[lang].unavailable}
          </p>
          <button
            type="button"
            className="mt-4 underline"
            onClick={() => router.invalidate()}
          >
            {lang === "nl" ? "Opnieuw proberen" : "Try again"}
          </button>
        </div>
      </main>
    );
  }
  return (
    <DashboardWorkspace
      organization={organization}
      setup={setup}
      initial={availability}
      lang={lang}
      onReload={async () => {
        await router.invalidate();
      }}
    />
  );
}
