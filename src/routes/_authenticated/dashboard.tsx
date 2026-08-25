import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarDays, Clock3 } from "lucide-react";

import { organizationCopy } from "#/content/organization";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ context, deps }) => {
    const state = context.organizationContext;

    if (state.status === "setup-required") {
      throw redirect({ to: "/setup", search: { lang: deps.lang } });
    }

    return state.status === "ready"
      ? { organization: state.organization, unavailable: false as const }
      : { organization: undefined, unavailable: true as const };
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
  const { organization, unavailable } = Route.useLoaderData();
  const allCopy = organizationCopy[lang];
  const copy = allCopy.dashboard;

  if (unavailable || !organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <p role="alert" className="text-muted-foreground">
          {allCopy.unavailable}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b bg-card/80 py-5 pr-52 pl-5 backdrop-blur sm:pl-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a
            href={`/?lang=${lang}`}
            className="font-heading font-semibold text-xl tracking-[-0.04em]"
          >
            Geregeld
          </a>
          <span className="hidden max-w-64 truncate rounded-full bg-muted px-4 py-2 font-semibold text-sm sm:inline">
            {organization.name}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-balance font-heading font-semibold text-4xl tracking-[-0.055em] sm:text-6xl">
          {copy.title(organization.name)}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {copy.description}
        </p>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-46px_oklch(0.23_0.035_151/0.4)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading font-semibold text-xl">
                {copy.bookings}
              </h2>
              <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary">
                <CalendarDays aria-hidden="true" className="size-5" />
              </span>
            </div>
            <p className="mt-8 font-heading font-semibold text-3xl tracking-[-0.04em]">
              {copy.bookingsValue}
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {copy.bookingsEmpty}
            </p>
          </article>

          <article className="rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-46px_oklch(0.23_0.035_151/0.4)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading font-semibold text-xl">
                {copy.availability}
              </h2>
              <span className="grid size-11 place-items-center rounded-2xl bg-accent text-primary">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
            </div>
            <p className="mt-8 font-heading font-semibold text-3xl tracking-[-0.04em]">
              {copy.availabilityValue}
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {copy.availabilityEmpty}
            </p>
          </article>
        </section>

        <p className="mt-6 text-muted-foreground text-sm">
          {copy.timeZone}: {organization.timeZone.replaceAll("_", " ")}
        </p>
      </div>
    </main>
  );
}
