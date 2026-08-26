import { useBlocker } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import type { organizationCopy } from "#/content/organization";
import type {
  AvailabilityOverview,
  BookingHoursDateException,
  TimeWindow,
  WeeklyBookingHoursWindow,
} from "#/contexts/availability/slices/manage-availability/contract";
import {
  deleteBookingHoursDateExceptionFn,
  getAvailabilityFn,
  replaceWeeklyBookingHoursFn,
  upsertBookingHoursDateRangeFn,
} from "#/contexts/availability/slices/manage-availability/functions";
import {
  addLocalDays,
  localDateDayOfWeek,
  localDateToEpochDay,
} from "#/contexts/availability/slices/manage-availability/local-date";
import type { UiLocale } from "#/shared/i18n";

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<Widen<U>>
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;

type EditorCopy = Widen<(typeof organizationCopy)["en"]["availability"]>;

interface AvailabilityEditorProps {
  readonly copy: EditorCopy;
  readonly initial: AvailabilityOverview;
  readonly lang: UiLocale;
  readonly timeZone: string;
  readonly onSaved: () => Promise<void>;
}

type EditorError = "INVALID_INPUT" | "UNAVAILABLE";

const dayOrder = [1, 2, 3, 4, 5, 6, 0] as const;
const defaultWindow: TimeWindow = {
  startMinute: 9 * 60,
  endMinute: 17 * 60,
};
const startOptions = Array.from({ length: 96 }, (_, index) => index * 15);
const endOptions = Array.from({ length: 96 }, (_, index) => (index + 1) * 15);

function minuteLabel(minute: number): string {
  if (minute === 1440) return "24:00";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(
    minute % 60,
  ).padStart(2, "0")}`;
}

function dayLabel(dayIndex: number, lang: UiLocale): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(Date.UTC(2024, 0, 1 + dayIndex)));
}

function dateLabel(date: string, lang: UiLocale): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function sortWindows(windows: ReadonlyArray<TimeWindow>): Array<TimeWindow> {
  return [...windows].sort(
    (left, right) => left.startMinute - right.startMinute,
  );
}

function sortWeeklyHours(
  windows: ReadonlyArray<WeeklyBookingHoursWindow>,
): Array<WeeklyBookingHoursWindow> {
  return [...windows].sort(
    (left, right) =>
      dayOrder.indexOf(left.dayOfWeek as (typeof dayOrder)[number]) -
        dayOrder.indexOf(right.dayOfWeek as (typeof dayOrder)[number]) ||
      left.startMinute - right.startMinute,
  );
}

function comparableWeeklyHours(
  windows: ReadonlyArray<WeeklyBookingHoursWindow>,
): string {
  return JSON.stringify(
    sortWeeklyHours(windows).map(({ dayOfWeek, startMinute, endMinute }) => ({
      dayOfWeek,
      startMinute,
      endMinute,
    })),
  );
}

function windowsAreValid(windows: ReadonlyArray<TimeWindow>): boolean {
  const sorted = sortWindows(windows);
  return (
    sorted.length > 0 &&
    sorted.every(
      (window, index) =>
        Number.isInteger(window.startMinute) &&
        Number.isInteger(window.endMinute) &&
        window.startMinute >= 0 &&
        window.endMinute <= 1440 &&
        window.startMinute < window.endMinute &&
        (index === 0 || sorted[index - 1].endMinute <= window.startMinute),
    )
  );
}

function weeklyHoursAreValid(
  windows: ReadonlyArray<WeeklyBookingHoursWindow>,
): boolean {
  return dayOrder.every((dayOfWeek) => {
    const dayWindows = windows.filter(
      (window) => window.dayOfWeek === dayOfWeek,
    );
    return dayWindows.length === 0 || windowsAreValid(dayWindows);
  });
}

function regularHoursForDate(
  date: string,
  weeklyHours: ReadonlyArray<WeeklyBookingHoursWindow>,
): Array<TimeWindow> {
  const dayOfWeek = localDateDayOfWeek(date);
  return weeklyHours
    .filter((window) => window.dayOfWeek === dayOfWeek)
    .map(({ startMinute, endMinute }) => ({ startMinute, endMinute }));
}

function nextWindow(windows: ReadonlyArray<TimeWindow>): TimeWindow {
  const last = sortWindows(windows).at(-1);
  if (!last || last.endMinute >= 23 * 60) return { ...defaultWindow };
  const startMinute = Math.min(last.endMinute + 60, 23 * 60);
  return { startMinute, endMinute: Math.min(startMinute + 60, 1440) };
}

function actionError(error: string): EditorError {
  return error === "INVALID_INPUT" ? "INVALID_INPUT" : "UNAVAILABLE";
}

function TimeSelect({
  value,
  kind,
  label,
  onChange,
}: {
  readonly value: number;
  readonly kind: "start" | "end";
  readonly label: string;
  readonly onChange: (minute: number) => void;
}) {
  const options = kind === "start" ? startOptions : endOptions;
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block font-semibold text-muted-foreground text-xs">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-9 font-semibold text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        >
          {options.map((minute) => (
            <option key={minute} value={minute}>
              {minuteLabel(minute)}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  );
}

export function AvailabilityEditor({
  copy,
  initial,
  lang,
  timeZone,
  onSaved,
}: AvailabilityEditorProps) {
  const [configured, setConfigured] = useState(initial.configured);
  const [weeklyHours, setWeeklyHours] = useState(() =>
    sortWeeklyHours(initial.weeklyHours),
  );
  const [savedWeeklyHours, setSavedWeeklyHours] = useState(() =>
    sortWeeklyHours(initial.weeklyHours),
  );
  const [rememberedHours, setRememberedHours] = useState<
    Record<number, Array<TimeWindow>>
  >(() =>
    Object.fromEntries(
      dayOrder.map((dayOfWeek) => {
        const windows = initial.weeklyHours
          .filter((window) => window.dayOfWeek === dayOfWeek)
          .map(({ startMinute, endMinute }) => ({ startMinute, endMinute }));
        return [
          dayOfWeek,
          windows.length > 0 ? windows : [{ ...defaultWindow }],
        ];
      }),
    ),
  );
  const [setupDays, setSetupDays] = useState<Array<number>>([]);
  const [setupStart, setSetupStart] = useState(defaultWindow.startMinute);
  const [setupEnd, setSetupEnd] = useState(defaultWindow.endMinute);
  const [editingDay, setEditingDay] = useState<number>();
  const [exceptions, setExceptions] = useState<
    Array<BookingHoursDateException>
  >([...initial.dateExceptions]);
  const [dateFormOpen, setDateFormOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(initial.localToday);
  const [dateTo, setDateTo] = useState("");
  const [dateAvailable, setDateAvailable] = useState(false);
  const [dateWindows, setDateWindows] = useState<Array<TimeWindow>>([]);
  const [isSavingWeek, setIsSavingWeek] = useState(false);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [isRestoringDate, setIsRestoringDate] = useState(false);
  const [error, setError] = useState<EditorError>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let active = true;
    void getAvailabilityFn({
      data: {
        from: initial.localToday,
        to: addLocalDays(initial.localToday, 365),
      },
    }).then((result) => {
      if (active && result.ok) setExceptions([...result.value.dateExceptions]);
    });
    return () => {
      active = false;
    };
  }, [initial.localToday]);

  const hasWeeklyChanges =
    comparableWeeklyHours(weeklyHours) !==
    comparableWeeklyHours(savedWeeklyHours);
  const weeklyInvalid = !weeklyHoursAreValid(weeklyHours);
  const selectedException = exceptions.find(
    (exception) => exception.date === dateFrom,
  );
  const dateRangeInvalid =
    dateFrom < initial.localToday ||
    (dateTo.length > 0 &&
      (dateTo < dateFrom ||
        localDateToEpochDay(dateTo) - localDateToEpochDay(dateFrom) > 365));
  const dateInvalid =
    dateRangeInvalid ||
    (dateAvailable &&
      (dateWindows.length === 0 || !windowsAreValid(dateWindows)));
  const nextException = useMemo(
    () =>
      [...exceptions]
        .filter((exception) => exception.date >= initial.localToday)
        .sort((left, right) => left.date.localeCompare(right.date))[0],
    [exceptions, initial.localToday],
  );

  useBlocker({
    shouldBlockFn: () =>
      hasWeeklyChanges && !window.confirm(copy.discardChanges),
    enableBeforeUnload: hasWeeklyChanges,
  });

  function clearStatus() {
    setError(undefined);
    setMessage(undefined);
  }

  function toggleSetupDay(dayOfWeek: number) {
    clearStatus();
    setSetupDays((current) =>
      current.includes(dayOfWeek)
        ? current.filter((day) => day !== dayOfWeek)
        : [...current, dayOfWeek],
    );
  }

  async function saveFirstSetup() {
    if (setupDays.length === 0 || setupStart >= setupEnd || setupEnd > 1440) {
      setError("INVALID_INPUT");
      return;
    }
    const nextHours = sortWeeklyHours(
      setupDays.map((dayOfWeek) => ({
        dayOfWeek,
        startMinute: setupStart,
        endMinute: setupEnd,
      })),
    );
    setIsSavingWeek(true);
    clearStatus();
    try {
      const result = await replaceWeeklyBookingHoursFn({
        data: { windows: nextHours },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }
      setConfigured(true);
      setWeeklyHours(nextHours);
      setSavedWeeklyHours(nextHours);
      setRememberedHours((current) => ({
        ...current,
        ...Object.fromEntries(
          setupDays.map((dayOfWeek) => [
            dayOfWeek,
            [{ startMinute: setupStart, endMinute: setupEnd }],
          ]),
        ),
      }));
      setMessage(copy.saved);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingWeek(false);
    }
  }

  function setDayAvailable(dayOfWeek: number, available: boolean) {
    clearStatus();
    const currentWindows = weeklyHours
      .filter((window) => window.dayOfWeek === dayOfWeek)
      .map(({ startMinute, endMinute }) => ({ startMinute, endMinute }));
    if (!available) {
      if (currentWindows.length > 0) {
        setRememberedHours((current) => ({
          ...current,
          [dayOfWeek]: currentWindows,
        }));
      }
      setWeeklyHours((current) =>
        current.filter((window) => window.dayOfWeek !== dayOfWeek),
      );
      return;
    }
    const restored = rememberedHours[dayOfWeek] ?? [{ ...defaultWindow }];
    setWeeklyHours((current) =>
      sortWeeklyHours([
        ...current.filter((window) => window.dayOfWeek !== dayOfWeek),
        ...restored.map((window) => ({ dayOfWeek, ...window })),
      ]),
    );
  }

  function updateWeeklyWindow(
    dayOfWeek: number,
    index: number,
    field: "startMinute" | "endMinute",
    minute: number,
  ) {
    clearStatus();
    setWeeklyHours((current) => {
      let dayIndex = -1;
      return current.map((window) => {
        if (window.dayOfWeek !== dayOfWeek) return window;
        dayIndex += 1;
        return dayIndex === index ? { ...window, [field]: minute } : window;
      });
    });
  }

  function addWeeklyWindow(dayOfWeek: number) {
    const dayWindows = weeklyHours.filter(
      (window) => window.dayOfWeek === dayOfWeek,
    );
    clearStatus();
    setWeeklyHours((current) =>
      sortWeeklyHours([...current, { dayOfWeek, ...nextWindow(dayWindows) }]),
    );
  }

  function removeWeeklyWindow(dayOfWeek: number, index: number) {
    let dayIndex = -1;
    clearStatus();
    setWeeklyHours((current) =>
      current.filter((window) => {
        if (window.dayOfWeek !== dayOfWeek) return true;
        dayIndex += 1;
        return dayIndex !== index;
      }),
    );
  }

  async function saveWeek() {
    if (weeklyInvalid) {
      setError("INVALID_INPUT");
      return;
    }
    setIsSavingWeek(true);
    clearStatus();
    try {
      const cleanHours = sortWeeklyHours(weeklyHours).map(
        ({ dayOfWeek, startMinute, endMinute }) => ({
          dayOfWeek,
          startMinute,
          endMinute,
        }),
      );
      const result = await replaceWeeklyBookingHoursFn({
        data: { windows: cleanHours },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }
      setWeeklyHours(cleanHours);
      setSavedWeeklyHours(cleanHours);
      setMessage(copy.saved);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingWeek(false);
    }
  }

  function openDateForm() {
    clearStatus();
    setEditingDay(undefined);
    setDateFormOpen(true);
    setDateFrom(initial.localToday);
    setDateTo("");
    const current = exceptions.find(
      (exception) => exception.date === initial.localToday,
    );
    setDateAvailable(Boolean(current && current.windows.length > 0));
    setDateWindows(current ? [...current.windows] : []);
  }

  function changeDateFrom(date: string) {
    setDateFrom(date);
    if (dateTo && dateTo < date) setDateTo("");
    const current = exceptions.find((exception) => exception.date === date);
    setDateAvailable(Boolean(current && current.windows.length > 0));
    setDateWindows(current ? [...current.windows] : []);
    clearStatus();
  }

  function setCustomersCanBook(available: boolean) {
    setDateAvailable(available);
    if (available && dateWindows.length === 0) {
      const regular = regularHoursForDate(dateFrom, weeklyHours);
      setDateWindows(regular.length > 0 ? regular : [{ ...defaultWindow }]);
    }
    clearStatus();
  }

  function updateDateWindow(
    index: number,
    field: "startMinute" | "endMinute",
    minute: number,
  ) {
    clearStatus();
    setDateWindows((current) =>
      current.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [field]: minute } : window,
      ),
    );
  }

  async function saveDateChange() {
    if (dateInvalid) {
      setError("INVALID_INPUT");
      return;
    }
    setIsSavingDate(true);
    clearStatus();
    try {
      const result = await upsertBookingHoursDateRangeFn({
        data: {
          from: dateFrom,
          to: dateTo || dateFrom,
          windows: dateAvailable ? sortWindows(dateWindows) : [],
        },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }
      const changedDates = new Set(result.value.map((item) => item.date));
      setExceptions((current) =>
        [
          ...current.filter((item) => !changedDates.has(item.date)),
          ...result.value,
        ].sort((left, right) => left.date.localeCompare(right.date)),
      );
      setDateFormOpen(false);
      setMessage(copy.saved);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingDate(false);
    }
  }

  async function restoreDate() {
    if (!selectedException || dateTo) return;
    setIsRestoringDate(true);
    clearStatus();
    try {
      const result = await deleteBookingHoursDateExceptionFn({
        data: { date: selectedException.date },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }
      setExceptions((current) =>
        current.filter((item) => item.date !== selectedException.date),
      );
      setDateFormOpen(false);
      setMessage(copy.saved);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsRestoringDate(false);
    }
  }

  function renderTimeWindow(
    window: TimeWindow,
    index: number,
    count: number,
    update: (
      index: number,
      field: "startMinute" | "endMinute",
      minute: number,
    ) => void,
    remove: (index: number) => void,
  ) {
    return (
      <div
        key={`${index}-${window.startMinute}-${window.endMinute}`}
        className="flex items-end gap-2"
      >
        <TimeSelect
          value={window.startMinute}
          kind="start"
          label={copy.from}
          onChange={(minute) => update(index, "startMinute", minute)}
        />
        <TimeSelect
          value={window.endMinute}
          kind="end"
          label={copy.until}
          onChange={(minute) => update(index, "endMinute", minute)}
        />
        {count > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            aria-label={copy.removeTime}
            className="mb-0.5"
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    );
  }

  if (!configured) {
    return (
      <section id="availability-editor" className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_28px_70px_-48px_oklch(0.23_0.035_151/0.45)] sm:p-8">
          <h1 className="text-balance font-heading font-semibold text-4xl tracking-[-0.055em] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {copy.setupDescription}
          </p>
          <fieldset className="mt-8">
            <legend className="font-heading font-semibold text-xl">
              {copy.setupDays}
            </legend>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {dayOrder.map((dayOfWeek, index) => {
                const selected = setupDays.includes(dayOfWeek);
                return (
                  <button
                    key={dayOfWeek}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSetupDay(dayOfWeek)}
                    className="h-12 rounded-2xl border border-border bg-background font-semibold text-sm outline-none transition hover:border-primary/40 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    {dayLabel(index, lang).slice(0, 2)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-7 flex items-end gap-3">
            <TimeSelect
              value={setupStart}
              kind="start"
              label={copy.from}
              onChange={(minute) => {
                setSetupStart(minute);
                clearStatus();
              }}
            />
            <TimeSelect
              value={setupEnd}
              kind="end"
              label={copy.until}
              onChange={(minute) => {
                setSetupEnd(minute);
                clearStatus();
              }}
            />
          </div>
          <Button
            type="button"
            size="lg"
            onClick={saveFirstSetup}
            disabled={
              isSavingWeek || setupDays.length === 0 || setupStart >= setupEnd
            }
            className="mt-8 h-12 w-full font-semibold"
          >
            <Check aria-hidden="true" />
            {isSavingWeek ? copy.saving : copy.setAvailability}
          </Button>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
            >
              {error === "INVALID_INPUT"
                ? copy.errors.invalid
                : copy.errors.unavailable}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section id="availability-editor" className="mx-auto max-w-2xl pb-8">
      <h1 className="text-balance font-heading font-semibold text-4xl tracking-[-0.055em] sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">
        {copy.timeZone} <strong>{timeZone.replaceAll("_", " ")}</strong>
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_60px_-46px_oklch(0.23_0.035_151/0.4)]">
        <div className="border-border border-b px-5 py-4 sm:px-6">
          <h2 className="font-heading font-semibold text-xl">
            {copy.yourWeek}
          </h2>
        </div>
        {dayOrder.map((dayOfWeek, dayIndex) => {
          const dayWindows = sortWindows(
            weeklyHours.filter((window) => window.dayOfWeek === dayOfWeek),
          );
          const available = dayWindows.length > 0;
          const editing = editingDay === dayOfWeek;
          return (
            <div
              key={dayOfWeek}
              className="border-border border-b last:border-b-0"
            >
              <button
                type="button"
                aria-expanded={editing}
                onClick={() => setEditingDay(editing ? undefined : dayOfWeek)}
                className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-4 text-left outline-none transition hover:bg-muted/45 focus-visible:bg-muted/45 sm:px-6"
              >
                <span className="font-semibold capitalize">
                  {dayLabel(dayIndex, lang)}
                </span>
                <span
                  className={
                    available
                      ? "font-semibold text-sm"
                      : "text-muted-foreground text-sm"
                  }
                >
                  {available
                    ? dayWindows
                        .map(
                          (window) =>
                            `${minuteLabel(window.startMinute)} – ${minuteLabel(window.endMinute)}`,
                        )
                        .join(", ")
                    : copy.closed}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className={`size-4 text-muted-foreground transition-transform ${editing ? "rotate-90" : ""}`}
                />
              </button>
              {editing ? (
                <div className="border-border border-t bg-muted/35 px-5 py-5 sm:px-6">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
                    <button
                      type="button"
                      aria-pressed={available}
                      onClick={() => setDayAvailable(dayOfWeek, true)}
                      className="h-10 rounded-xl font-semibold text-sm outline-none transition aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      {copy.available}
                    </button>
                    <button
                      type="button"
                      aria-pressed={!available}
                      onClick={() => setDayAvailable(dayOfWeek, false)}
                      className="h-10 rounded-xl font-semibold text-sm outline-none transition aria-pressed:bg-card aria-pressed:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      {copy.closed}
                    </button>
                  </div>
                  {available ? (
                    <div className="mt-5 grid gap-3">
                      {dayWindows.map((window, index) =>
                        renderTimeWindow(
                          window,
                          index,
                          dayWindows.length,
                          (windowIndex, field, minute) =>
                            updateWeeklyWindow(
                              dayOfWeek,
                              windowIndex,
                              field,
                              minute,
                            ),
                          (windowIndex) =>
                            removeWeeklyWindow(dayOfWeek, windowIndex),
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => addWeeklyWindow(dayOfWeek)}
                        className="mt-1 inline-flex w-fit items-center gap-2 font-semibold text-primary text-sm outline-none hover:underline focus-visible:rounded focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <Plus aria-hidden="true" className="size-4" />
                        {copy.addAnotherTime}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {hasWeeklyChanges ? (
        <div className="sticky bottom-4 z-20 mt-5 rounded-2xl border border-border bg-card/95 p-3 shadow-[0_18px_55px_-24px_oklch(0.18_0.03_150/0.7)] backdrop-blur">
          <Button
            type="button"
            size="lg"
            onClick={saveWeek}
            disabled={isSavingWeek || weeklyInvalid}
            className="h-12 w-full font-semibold"
          >
            <Check aria-hidden="true" />
            {isSavingWeek ? copy.saving : copy.saveChanges}
          </Button>
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
        {dateFormOpen ? (
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading font-semibold text-xl">
                {copy.changeDates}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDateFormOpen(false);
                  clearStatus();
                }}
                aria-label={copy.cancel}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="font-semibold text-sm">{copy.date}</span>
                <input
                  type="date"
                  min={initial.localToday}
                  max="2099-12-31"
                  value={dateFrom}
                  onChange={(event) => changeDateFrom(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                />
              </label>
              <label>
                <span className="font-semibold text-sm">
                  {copy.endDateOptional}
                </span>
                <input
                  type="date"
                  min={dateFrom}
                  max="2099-12-31"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    clearStatus();
                  }}
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                />
              </label>
            </div>
            <fieldset className="mt-6">
              <legend className="font-semibold text-sm">{copy.canBook}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
                <button
                  type="button"
                  aria-pressed={dateAvailable}
                  onClick={() => setCustomersCanBook(true)}
                  className="h-10 rounded-xl font-semibold text-sm outline-none transition aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {copy.yes}
                </button>
                <button
                  type="button"
                  aria-pressed={!dateAvailable}
                  onClick={() => setCustomersCanBook(false)}
                  className="h-10 rounded-xl font-semibold text-sm outline-none transition aria-pressed:bg-card aria-pressed:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {copy.no}
                </button>
              </div>
            </fieldset>
            {dateAvailable ? (
              <div className="mt-5 grid gap-3">
                {dateWindows.map((window, index) =>
                  renderTimeWindow(
                    window,
                    index,
                    dateWindows.length,
                    updateDateWindow,
                    (windowIndex) =>
                      setDateWindows((current) =>
                        current.filter(
                          (_, itemIndex) => itemIndex !== windowIndex,
                        ),
                      ),
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setDateWindows((current) => [
                      ...current,
                      nextWindow(current),
                    ])
                  }
                  className="mt-1 inline-flex w-fit items-center gap-2 font-semibold text-primary text-sm outline-none hover:underline focus-visible:rounded focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  {copy.addAnotherTime}
                </button>
              </div>
            ) : null}
            {selectedException && !dateTo ? (
              <Button
                type="button"
                variant="ghost"
                onClick={restoreDate}
                disabled={isRestoringDate}
                className="mt-6 text-muted-foreground"
              >
                <RotateCcw aria-hidden="true" />
                {copy.restoreUsualHours}
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              onClick={saveDateChange}
              disabled={isSavingDate || dateInvalid}
              className="mt-6 h-12 w-full font-semibold"
            >
              <Check aria-hidden="true" />
              {isSavingDate ? copy.saving : copy.confirm}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading font-semibold text-xl">
                {copy.specificDates}
              </h2>
              {nextException ? (
                <p className="mt-1 text-muted-foreground text-sm">
                  {nextException.windows.length === 0
                    ? copy.nextClosed(dateLabel(nextException.date, lang))
                    : copy.nextChanged(dateLabel(nextException.date, lang))}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={openDateForm}
              className="h-11"
            >
              {copy.changeDates}
            </Button>
          </div>
        )}
      </div>

      <div className="min-h-16 pt-4">
        {error || (hasWeeklyChanges && weeklyInvalid) ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
          >
            {error === "INVALID_INPUT" || (hasWeeklyChanges && weeklyInvalid)
              ? copy.errors.invalid
              : copy.errors.unavailable}
          </p>
        ) : message ? (
          <output className="block rounded-xl bg-primary/10 px-3 py-2 text-primary text-sm">
            {message}
          </output>
        ) : null}
      </div>
    </section>
  );
}
