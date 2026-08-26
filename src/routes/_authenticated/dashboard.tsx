import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3, Settings2 } from "lucide-react";

import { AppControls } from "#/components/app-controls";
import {
  dateGroupLabel,
  groupUpcomingDateExceptions,
} from "#/components/availability-date-groups";
import { Brand } from "#/components/brand";
import { organizationCopy } from "#/content/organization";
import type { AvailabilityOverview } from "#/contexts/availability/slices/manage-availability/contract";
import { getAvailabilityFn } from "#/contexts/availability/slices/manage-availability/functions";
import { addLocalDays } from "#/contexts/availability/slices/manage-availability/local-date";
import { resolveUiLocale, type UiLocale } from "#/shared/i18n";

const dayOrder = [1, 2, 3, 4, 5, 6, 0] as const;

function minuteLabel(minute: number): string {
  if (minute === 1440) return "24:00";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(
    minute % 60,
  ).padStart(2, "0")}`;
}

function dayName(dayIndex: number, lang: UiLocale): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(Date.UTC(2024, 0, 1 + dayIndex)));
}

function shortDate(date: string, lang: UiLocale): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function weeklySummary(
  availability: AvailabilityOverview,
  lang: UiLocale,
  copy: (typeof organizationCopy)["en"]["dashboard"],
): { readonly title: string; readonly detail: string } {
  const windowsByDay = dayOrder.map((dayOfWeek) =>
    availability.weeklyHours
      .filter((window) => window.dayOfWeek === dayOfWeek)
      .sort((left, right) => left.startMinute - right.startMinute),
  );
  const openIndexes = windowsByDay.flatMap((windows, index) =>
    windows.length > 0 ? [index] : [],
  );

  if (openIndexes.length === 0) {
    return {
      title: copy.availabilityNoUpcoming,
      detail: copy.availabilityClosed,
    };
  }

  const signatures = openIndexes.map((index) =>
    windowsByDay[index]
      .map((window) => `${window.startMinute}-${window.endMinute}`)
      .join(","),
  );
  const sameHours = signatures.every(
    (signature) => signature === signatures[0],
  );
  const consecutive = openIndexes.every(
    (dayIndex, index) => index === 0 || dayIndex === openIndexes[index - 1] + 1,
  );

  if (!sameHours) {
    const nextDay = availability.days.find((day) => day.windows.length > 0);
    const nextHours = nextDay?.windows
      .map(
        (window) =>
          `${minuteLabel(window.startMinute)} – ${minuteLabel(window.endMinute)}`,
      )
      .join(", ");

    return {
      title: copy.availabilityConfigured(openIndexes.length),
      detail:
        nextDay && nextHours
          ? `${nextDay.date === availability.localToday ? copy.today : shortDate(nextDay.date, lang)} · ${nextHours}`
          : copy.availabilityClosed,
    };
  }

  const names = openIndexes.map((index) => dayName(index, lang));
  const title =
    consecutive && names.length > 1
      ? copy.dayRange(names[0], names.at(-1) ?? names[0])
      : new Intl.ListFormat(lang, {
          style: "long",
          type: "conjunction",
        }).format(names);
  const detail = windowsByDay[openIndexes[0]]
    .map(
      (window) =>
        `${minuteLabel(window.startMinute)} – ${minuteLabel(window.endMinute)}`,
    )
    .join(", ");

  return { title, detail };
}

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

    const initial = await getAvailabilityFn({ data: {} });
    if (!initial.ok) {
      return {
        organization: state.organization,
        availability: undefined,
        unavailable: false as const,
      };
    }

    const expanded = await getAvailabilityFn({
      data: {
        from: initial.value.localToday,
        to: addLocalDays(initial.value.localToday, 365),
      },
    });

    return {
      organization: state.organization,
      availability: expanded.ok ? expanded.value : initial.value,
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

  if (unavailable || !organization) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <p role="alert" className="text-muted-foreground">
          {allCopy.unavailable}
        </p>
      </main>
    );
  }

  const summary =
    availability?.configured && availability
      ? weeklySummary(
          availability,
          lang,
          organizationCopy[lang]
            .dashboard as (typeof organizationCopy)["en"]["dashboard"],
        )
      : {
          title: copy.availabilityValue,
          detail: copy.availabilityEmpty,
        };
  const upcomingDateGroups = availability
    ? groupUpcomingDateExceptions(
        availability.dateExceptions,
        availability.localToday,
      )
    : [];

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

            <p className="mt-8 text-balance font-heading font-semibold text-3xl tracking-[-0.04em] capitalize">
              {summary.title}
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              {summary.detail}
            </p>

            {upcomingDateGroups.length > 0 ? (
              <div className="mt-5 grid gap-2">
                {upcomingDateGroups.slice(0, 3).map((group) => (
                  <p
                    key={`${group.from}-${group.to}`}
                    className="rounded-2xl bg-muted px-4 py-3 text-muted-foreground text-sm"
                  >
                    {group.windows.length === 0
                      ? copy.nextClosed(dateGroupLabel(group, lang))
                      : copy.nextChanged(dateGroupLabel(group, lang))}
                  </p>
                ))}
                {upcomingDateGroups.length > 3 ? (
                  <p className="px-1 text-muted-foreground text-xs">
                    {copy.moreDates(upcomingDateGroups.length - 3)}
                  </p>
                ) : null}
              </div>
            ) : null}

            <Link
              to="/availability"
              search={{ lang }}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-input/30 px-4 font-semibold text-sm transition-colors hover:bg-input/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {availability?.configured
                ? copy.editAvailability
                : copy.setAvailability}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
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
      </div>
    </main>
  );
}
