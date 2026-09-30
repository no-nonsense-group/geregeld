import { Dialog } from "@base-ui/react/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  Plus,
  Scissors,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { AppControls } from "#/components/app-controls";
import { AvailabilityEditor } from "#/components/availability-editor";
import { Brand } from "#/components/brand";
import { Button } from "#/components/ui/button";
import { dashboardCopy } from "#/content/dashboard";
import { organizationCopy } from "#/content/organization";
import type { AvailabilityOverview } from "#/contexts/availability/slices/manage-availability/contract";
import { getAvailabilityFn } from "#/contexts/availability/slices/manage-availability/functions";
import { addLocalDays } from "#/contexts/availability/slices/manage-availability/local-date";
import type {
  BookingChange,
  BookingSetup,
} from "#/contexts/booking/slices/manage-booking/contract";
import { saveBookingSetupFn } from "#/contexts/booking/slices/manage-booking/functions";
import type { UiLocale } from "#/shared/i18n";

const modeIcons = { appointments: Scissors, tables: Users, rooms: DoorOpen };
const modes = ["appointments", "tables", "rooms"] as const;
const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring";
const time = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

// The summary describes available hours, without making owners count individual periods.
export function summarizeHours(periods: AvailabilityOverview["periods"]) {
  const merged: Array<{ startMinute: number; endMinute: number }> = [];
  for (const period of [...periods].sort(
    (a, b) => a.startMinute - b.startMinute,
  )) {
    const previous = merged.at(-1);
    if (previous && period.startMinute <= previous.endMinute)
      previous.endMinute = Math.max(previous.endMinute, period.endMinute);
    else
      merged.push({
        startMinute: period.startMinute,
        endMinute: period.endMinute,
      });
  }
  return merged.map(
    (period) => `${time(period.startMinute)} – ${time(period.endMinute)}`,
  );
}

export function DashboardWorkspace({
  organization,
  setup,
  initial,
  lang,
  onReload,
}: {
  organization: { id: string; name: string; timeZone: string };
  setup: BookingSetup;
  initial?: AvailabilityOverview;
  lang: UiLocale;
  onReload: () => Promise<void>;
}) {
  const c = dashboardCopy[lang];
  const queryClient = useQueryClient();
  const [view, setView] = useState<"availability" | "offerings" | "style">(
    "availability",
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [from, setFrom] = useState<string>();
  const [editingHours, setEditingHours] = useState(false);
  const [draft, setDraft] =
    useState<Exclude<BookingChange, { action: "mode" }>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const mode = setup.mode ?? "appointments";
  const resources = setup.resources.filter(
    (resource) => resource.kind === mode,
  );
  const resource =
    mode === "appointments"
      ? undefined
      : (resources.find((item) => item.id === selectedId) ?? resources[0]);
  const scope = resource ? { resourceId: resource.id } : {};
  const calendar = useQuery({
    queryKey: [
      "availability",
      organization.id,
      resource?.id ?? "personal",
      from ?? "current",
    ],
    queryFn: async () => {
      const result = await getAvailabilityFn({
        data: {
          ...scope,
          ...(from ? { from, to: addLocalDays(from, 6) } : {}),
        },
      });
      if (!result.ok) throw new Error("Calendar unavailable");
      return result.value;
    },
    enabled: mode === "appointments" || !!resource,
    initialData: mode === "appointments" && !from ? initial : undefined,
  });
  const week = calendar.data;
  const listTitle = mode === "appointments" ? c.services : c[mode];
  const addLabel =
    mode === "appointments"
      ? c.addService
      : mode === "tables"
        ? c.addTable
        : c.addRoom;
  const listHint =
    mode === "appointments"
      ? c.servicesHint
      : mode === "tables"
        ? c.tableListHint
        : c.roomListHint;
  const note =
    mode === "appointments"
      ? c.appointmentsNote
      : mode === "tables"
        ? c.tablesNote
        : c.roomsNote;
  const dateLabel = (date: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang, { timeZone: "UTC", ...options }).format(
      new Date(`${date}T12:00:00Z`),
    );

  async function save(change: BookingChange) {
    setBusy(true);
    setError(false);
    try {
      const result = await saveBookingSetupFn({ data: change });
      if (!result.ok) {
        setError(true);
        return;
      }
      await onReload();
      setDraft(undefined);
      if (change.action === "mode") {
        setSelectedId(undefined);
        setFrom(undefined);
        setEditingHours(false);
        setView(change.mode === "appointments" ? "availability" : "offerings");
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  function add() {
    setError(false);
    setDraft(
      mode === "appointments"
        ? { action: "service", name: "", durationMinutes: 30, active: true }
        : {
            action: "resource",
            kind: mode,
            name: "",
            capacity: mode === "tables" ? 4 : 1,
            active: true,
          },
    );
  }
  function openCalendar(id: string) {
    setSelectedId(id);
    setFrom(undefined);
    setEditingHours(false);
    setView("availability");
  }
  const stylePicker = (
    <section aria-labelledby="booking-style-title">
      <h2
        id="booking-style-title"
        className="font-heading font-semibold text-2xl tracking-tight"
      >
        {c.choose}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
        {setup.mode ? c.styleHint : c.chooseHint}
      </p>
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {modes.map((item) => {
          const Icon = modeIcons[item];
          return (
            <button
              key={item}
              type="button"
              disabled={busy || setup.mode === item}
              onClick={() => save({ action: "mode", mode: item })}
              className={`flex flex-col items-start rounded-2xl border bg-card p-6 text-left transition hover:border-primary focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default ${setup.mode === item ? "border-primary ring-1 ring-primary" : "border-border"}`}
            >
              <Icon aria-hidden="true" className="mb-5 size-6 text-primary" />
              <span className="font-semibold text-lg">{c[item]}</span>
              <span className="mt-2 flex-1 text-muted-foreground text-sm leading-relaxed">
                {c[`${item}Hint`]}
              </span>
              <span className="mt-6 flex items-center gap-2 font-medium text-primary text-sm">
                {setup.mode === item ? (
                  <>
                    <Check className="size-4" />
                    {c.current}
                  </>
                ) : (
                  <>
                    {c.chooseAction}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-border border-b bg-card">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/dashboard" search={{ lang }}>
            <Brand />
          </Link>
          <AppControls authenticated locale={lang} />
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl md:min-h-[calc(100vh-72px)] md:grid-cols-[208px_1fr]">
        <aside className="border-border border-b px-5 py-5 md:border-r md:border-b-0 md:py-8">
          <p className="truncate font-semibold" title={organization.name}>
            {organization.name}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">{c[mode]}</p>
          <nav
            aria-label={lang === "nl" ? "Dashboard" : "Dashboard"}
            className="mt-5 grid grid-cols-4 gap-1 md:mt-8 md:flex md:flex-col"
          >
            {(
              [
                {
                  id: "availability",
                  label: c.availability,
                  icon: CalendarDays,
                },
                { id: "offerings", label: listTitle, icon: modeIcons[mode] },
                { id: "style", label: c.setup, icon: Settings2 },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setEditingHours(false);
                }}
                aria-current={view === item.id ? "page" : undefined}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-muted-foreground text-xs transition sm:text-sm md:flex-row md:gap-2.5 md:px-3 md:text-left hover:bg-muted aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-foreground"
              >
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
              </button>
            ))}
            <Link
              to="/settings"
              search={{ lang }}
              className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-muted-foreground text-xs transition hover:bg-muted sm:text-sm md:flex-row md:gap-2.5 md:px-3 md:text-left"
            >
              <Building2 aria-hidden="true" className="size-4" />
              {lang === "nl" ? "Bedrijf" : "Business"}
            </Link>
          </nav>
          <p className="mt-8 hidden text-muted-foreground text-xs leading-relaxed md:block">
            {organization.timeZone.replaceAll("_", " ")}
          </p>
        </aside>
        <div className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          {error && !draft ? (
            <p
              role="alert"
              className="mb-5 rounded-xl bg-destructive/10 p-4 text-destructive text-sm"
            >
              {c.error}
            </p>
          ) : null}
          {!setup.mode || view === "style" ? (
            stylePicker
          ) : view === "offerings" ? (
            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading font-semibold text-3xl tracking-tight">
                    {listTitle}
                  </h1>
                  <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-relaxed">
                    {listHint}
                  </p>
                </div>
                <Button onClick={add}>
                  <Plus aria-hidden="true" />
                  {addLabel}
                </Button>
              </div>
              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
                {(mode === "appointments" ? setup.services : resources)
                  .length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <h2 className="font-semibold text-lg">
                      {mode === "appointments"
                        ? c.noServices
                        : mode === "tables"
                          ? c.noTables
                          : c.noRooms}
                    </h2>
                    <p className="mt-2 text-muted-foreground text-sm">
                      {mode === "appointments"
                        ? c.noServicesHint
                        : c.noResourcesHint}
                    </p>
                    <Button className="mt-6" variant="outline" onClick={add}>
                      <Plus />
                      {addLabel}
                    </Button>
                  </div>
                ) : (
                  (mode === "appointments" ? setup.services : resources).map(
                    (item) => (
                      <article
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-4 border-border border-b p-5 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <h2 className="break-words font-semibold">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-muted-foreground text-sm">
                            {"capacity" in item
                              ? `${item.capacity} ${c.people} · ${c.ownCalendar}`
                              : `${item.durationMinutes} ${c.minutes}`}
                            {!item.active ? ` · ${c.paused}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              save(
                                "capacity" in item
                                  ? {
                                      ...item,
                                      action: "resource",
                                      active: !item.active,
                                    }
                                  : {
                                      ...item,
                                      action: "service",
                                      active: !item.active,
                                    },
                              )
                            }
                          >
                            {item.active ? c.pause : c.resume}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setError(false);
                              setDraft(
                                "capacity" in item
                                  ? { ...item, action: "resource" }
                                  : { ...item, action: "service" },
                              );
                            }}
                          >
                            {c.edit}
                          </Button>
                          {"capacity" in item ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openCalendar(item.id)}
                            >
                              {c.calendar}
                              <ArrowRight />
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    ),
                  )
                )}
              </div>
              <p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                {note}
              </p>
            </section>
          ) : (
            <section>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading font-semibold text-3xl tracking-tight">
                    {c.title}
                  </h1>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {c.intro}
                  </p>
                </div>
                {(mode === "appointments" || resource) && !editingHours ? (
                  <Button
                    disabled={!week || calendar.isError}
                    onClick={() => setEditingHours(true)}
                  >
                    <Plus aria-hidden="true" />
                    {week?.configured ? c.editHours : c.setHours}
                  </Button>
                ) : null}
              </div>
              {mode !== "appointments" ? (
                <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
                  <label className="w-full max-w-xs text-sm">
                    <span className="font-medium">{c.selectResource}</span>
                    <select
                      className={fieldClass}
                      value={resource?.id ?? ""}
                      disabled={!resources.length}
                      onChange={(event) => openCalendar(event.target.value)}
                    >
                      {!resources.length ? (
                        <option value="">
                          {mode === "tables" ? c.noTables : c.noRooms}
                        </option>
                      ) : (
                        resources.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.capacity} {c.people}
                            {!item.active ? ` · ${c.paused}` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <Button variant="ghost" onClick={() => setView("offerings")}>
                    {c.manage} {listTitle.toLowerCase()}
                    <ArrowRight />
                  </Button>
                </div>
              ) : null}
              {resource && !resource.active ? (
                <p className="mt-4 rounded-xl bg-muted p-3 text-muted-foreground text-sm">
                  {c.pausedHint}
                </p>
              ) : null}
              {mode !== "appointments" && !resource ? (
                <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
                  <p className="font-medium">
                    {mode === "tables" ? c.noTables : c.noRooms}
                  </p>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {c.noResourcesHint}
                  </p>
                  <Button
                    className="mt-5"
                    onClick={() => {
                      setView("offerings");
                      add();
                    }}
                  >
                    <Plus />
                    {addLabel}
                  </Button>
                </div>
              ) : calendar.isError ? (
                <div
                  role="alert"
                  className="mt-8 rounded-xl border border-border p-6"
                >
                  <p>{c.loadError}</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => calendar.refetch()}
                  >
                    {c.retry}
                  </Button>
                </div>
              ) : !week ? (
                <output className="mt-8 block text-muted-foreground">
                  {c.loading}
                </output>
              ) : editingHours ? (
                <div className="mt-7">
                  <p className="mb-3 font-medium text-sm">
                    {c.hoursFor} {resource?.name ?? organization.name}
                  </p>
                  <AvailabilityEditor
                    key={resource?.id ?? "personal"}
                    resourceId={resource?.id}
                    copy={organizationCopy[lang].dashboard.availabilityEditor}
                    initial={week}
                    lang={lang}
                    timeZone={organization.timeZone}
                    onClose={() => setEditingHours(false)}
                    onSaved={async () => {
                      await queryClient.invalidateQueries({
                        queryKey: ["availability", organization.id],
                      });
                      await onReload();
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-border border-b px-5 py-4">
                      <div>
                        <h2 className="font-semibold">
                          {resource?.name ?? c.myHours}
                        </h2>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {dateLabel(week.rangeFrom, {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          –{" "}
                          {dateLabel(week.rangeTo, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={c.previous}
                          disabled={week.rangeFrom <= week.localToday}
                          onClick={() =>
                            setFrom(addLocalDays(week.rangeFrom, -7))
                          }
                        >
                          <ChevronLeft />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFrom(undefined)}
                        >
                          {c.week}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={c.next}
                          onClick={() =>
                            setFrom(addLocalDays(week.rangeFrom, 7))
                          }
                        >
                          <ChevronRight />
                        </Button>
                      </div>
                    </div>
                    {Array.from({ length: 7 }, (_, index) => {
                      const date = addLocalDays(week.rangeFrom, index);
                      const hours = summarizeHours(
                        week.periods.filter((period) => period.date === date),
                      );
                      return (
                        <div
                          key={date}
                          className={`grid grid-cols-[110px_1fr] items-start gap-4 border-border/60 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[150px_1fr] ${date === week.localToday ? "bg-accent/35" : ""}`}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-8 text-muted-foreground tabular-nums">
                              {dateLabel(date, { day: "2-digit" })}
                            </span>
                            <span
                              className={
                                date === week.localToday ? "font-semibold" : ""
                              }
                            >
                              {dateLabel(date, { weekday: "short" })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm tabular-nums">
                            {hours.length ? (
                              hours.map((hours) => (
                                <span
                                  key={hours}
                                  className="flex items-center gap-2"
                                >
                                  <span className="size-1.5 rounded-full bg-primary" />
                                  {hours}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground/75">
                                {c.unavailableDay}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!week.periods.length ? (
                    <div className="mt-4 rounded-xl bg-muted/60 p-4">
                      <p className="font-medium text-sm">{c.noHours}</p>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {c.noHoursHint}
                      </p>
                    </div>
                  ) : null}
                  <p className="mt-4 flex items-center gap-2 text-muted-foreground text-xs">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {organization.timeZone.replaceAll("_", " ")}
                  </p>
                </>
              )}
            </section>
          )}
          {setup.mode && view !== "style" && !editingHours ? (
            <aside className="mt-9 border-border border-t pt-6">
              <h2 className="font-medium text-sm">{c.flow}</h2>
              <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-sm">
                {[
                  ...(mode === "tables"
                    ? [c.guestsStep]
                    : mode === "rooms"
                      ? [c.roomStep]
                      : setup.services.some((service) => service.active)
                        ? [c.serviceStep]
                        : []),
                  c.timeStep,
                  c.detailsStep,
                ].map((step, index) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-muted text-xs">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-muted-foreground text-xs">{c.flowHint}</p>
            </aside>
          ) : null}
        </div>
      </div>
      <Dialog.Root
        open={!!draft}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setDraft(undefined);
            setError(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[60] bg-foreground/25 backdrop-blur-[2px]" />
          <Dialog.Viewport className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
            <Dialog.Popup className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl outline-none">
              <Dialog.Title className="pr-10 font-heading font-semibold text-xl">
                {draft?.id ? c.edit : addLabel}
              </Dialog.Title>
              <Dialog.Description className="mt-2 pr-6 text-muted-foreground text-sm">
                {listHint}
              </Dialog.Description>
              <Dialog.Close
                className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted"
                aria-label={c.cancel}
                disabled={busy}
              >
                <X className="size-4" />
              </Dialog.Close>
              {draft ? (
                <form
                  className="mt-6 space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    save(draft);
                  }}
                >
                  <label className="block text-sm">
                    <span className="font-medium">{c.name}</span>
                    <input
                      required
                      maxLength={80}
                      className={fieldClass}
                      value={draft.name}
                      placeholder={
                        draft.action === "service"
                          ? c.nameService
                          : draft.kind === "tables"
                            ? c.nameTable
                            : c.nameRoom
                      }
                      onChange={(event) =>
                        setDraft({ ...draft, name: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium">
                      {draft.action === "service" ? c.duration : c.capacity}
                    </span>
                    <input
                      required
                      type="number"
                      min={1}
                      max={draft.action === "service" ? 1440 : 1000}
                      step={1}
                      className={fieldClass}
                      value={
                        draft.action === "service"
                          ? draft.durationMinutes || ""
                          : draft.capacity || ""
                      }
                      onChange={(event) =>
                        setDraft(
                          draft.action === "service"
                            ? {
                                ...draft,
                                durationMinutes: Number(event.target.value),
                              }
                            : {
                                ...draft,
                                capacity: Number(event.target.value),
                              },
                        )
                      }
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={draft.active}
                      onChange={(event) =>
                        setDraft({ ...draft, active: event.target.checked })
                      }
                    />
                    {c.active}
                  </label>
                  {error ? (
                    <p role="alert" className="text-destructive text-sm">
                      {c.error}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={busy}
                      onClick={() => setDraft(undefined)}
                    >
                      {c.cancel}
                    </Button>
                    <Button type="submit" disabled={busy || !draft.name.trim()}>
                      {busy ? c.saving : c.save}
                    </Button>
                  </div>
                </form>
              ) : null}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}
