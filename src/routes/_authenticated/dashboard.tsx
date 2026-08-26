import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { CalendarDays, ChevronDown, Clock3, Settings2 } from "lucide-react";
import { useState } from "react";
import { AppControls } from "#/components/app-controls";
import { AvailabilityEditor } from "#/components/availability-editor";
import { Brand } from "#/components/brand";
import { Button } from "#/components/ui/button";
import { organizationCopy } from "#/content/organization";
import { getAvailabilityFn } from "#/contexts/availability/slices/manage-availability/functions";
import { resolveUiLocale } from "#/shared/i18n";

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
        unavailable: true as const,
      };
    }

    const availability = await getAvailabilityFn({ data: {} });
    return {
      organization: state.organization,
      availability: availability.ok ? availability.value : undefined,
      unavailable: false as const,
    };
  },
  head: ({ match }) => {
    const copy = organizationCopy[resolveUiLocale(match.search.lang)].dashboard;

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
  const lang = resolveUiLocale(Route.useSearch().lang);
  const { organization, availability, unavailable } = Route.useLoaderData();
  const allCopy = organizationCopy[lang];
  const copy = allCopy.dashboard;
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const weekDays = availability?.days.slice(0, 7) ?? [];
  const openDayCount = weekDays.filter((day) => day.windows.length > 0).length;

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
      <header className="border-border border-b bg-card/80 backdrop-blur">
        <div className="mx-auto grid h-18 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8">
          <a href={`/dashboard?lang=${lang}`} className="w-fit">
            <Brand />
          </a>

          <AppControls
            authenticated
            locale={lang}
            className="justify-self-end"
          />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="max-w-3xl text-balance font-heading font-semibold text-4xl tracking-[-0.055em] sm:text-6xl">
            {copy.titleLead}{" "}
            <span className="font-bold text-primary [text-shadow:0_2px_18px_oklch(0.64_0.15_151/0.28)]">
              {organization.name}
            </span>
            .
          </h1>
          <Link
            to="/settings"
            search={{ lang }}
            className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <Settings2 aria-hidden="true" className="size-4" />
            {copy.settings}
          </Link>
        </div>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          {copy.description}
        </p>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
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
              {!availability?.configured
                ? copy.availabilityValue
                : openDayCount === 0
                  ? copy.availabilityNoUpcoming
                  : copy.availabilityConfigured(openDayCount)}
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {!availability?.configured
                ? copy.availabilityEmpty
                : copy.availabilitySchedule}
            </p>

            {availability ? (
              <div className="mt-6">
                <p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.12em]">
                  {copy.weekOverview}
                </p>
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {weekDays.map((day, index) => {
                    return (
                      <div
                        key={day.date}
                        className={`rounded-xl px-1 py-2 text-center ${
                          day.source === "exception"
                            ? "bg-accent ring-1 ring-primary/20"
                            : "bg-muted"
                        }`}
                        title={day.date}
                      >
                        <span className="block text-muted-foreground text-[0.65rem] uppercase">
                          {copy.weekdaysShort[index]}
                        </span>
                        <span className="mt-1 block truncate font-semibold text-[0.7rem]">
                          {day.windows.length === 0
                            ? "—"
                            : day.windows
                                .map(
                                  (window) =>
                                    `${String(Math.floor(window.startMinute / 60)).padStart(2, "0")}:${String(window.startMinute % 60).padStart(2, "0")}–${String(Math.floor(window.endMinute / 60)).padStart(2, "0")}:${String(window.endMinute % 60).padStart(2, "0")}`,
                                )
                                .join(", ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              className="mt-6 w-full"
              variant={availability?.configured ? "outline" : "default"}
              onClick={() => {
                setEditorOpen((open) => !open);
                requestAnimationFrame(() =>
                  document
                    .querySelector("#availability-editor")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                );
              }}
              disabled={!availability}
              aria-expanded={editorOpen}
              aria-controls="availability-editor"
            >
              {editorOpen ? copy.closeAvailability : copy.editAvailability}
              <ChevronDown
                aria-hidden="true"
                className={`transition-transform ${editorOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </article>

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
        </section>

        {editorOpen && availability ? (
          <div className="mt-5">
            <AvailabilityEditor
              copy={copy.availabilityEditor}
              initial={availability}
              lang={lang}
              timeZone={organization.timeZone}
              onClose={() => setEditorOpen(false)}
              onSaved={async () => {
                await router.invalidate();
              }}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
