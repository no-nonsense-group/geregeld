import {
  CalendarRange,
  Check,
  Clock3,
  Info,
  Plus,
  Trash2,
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
  upsertBookingHoursDateExceptionFn,
} from "#/contexts/availability/slices/manage-availability/functions";
import {
  addLocalDays,
  localDateDayOfWeek,
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

type EditorCopy = Widen<
  (typeof organizationCopy)["en"]["dashboard"]["availabilityEditor"]
>;

interface AvailabilityEditorProps {
  readonly copy: EditorCopy;
  readonly initial: AvailabilityOverview;
  readonly lang: UiLocale;
  readonly timeZone: string;
  readonly onClose: () => void;
  readonly onSaved: () => Promise<void>;
}

type EditorError = "INVALID_INPUT" | "UNAVAILABLE";
type ExceptionMode = "closed" | "custom";

const dayOrder = [1, 2, 3, 4, 5, 6, 0] as const;

function minuteToTime(minute: number): string {
  const normalized = minute === 1440 ? 1439 : minute;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
    normalized % 60,
  ).padStart(2, "0")}`;
}

function timeToMinute(value: string): number | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return undefined;
  }

  return hour * 60 + minute;
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

function sortWindows(windows: ReadonlyArray<TimeWindow>): Array<TimeWindow> {
  return [...windows].sort(
    (left, right) => left.startMinute - right.startMinute,
  );
}

function windowsAreValid(windows: ReadonlyArray<TimeWindow>): boolean {
  const sorted = sortWindows(windows);
  return sorted.every(
    (window, index) =>
      Number.isInteger(window.startMinute) &&
      Number.isInteger(window.endMinute) &&
      window.startMinute >= 0 &&
      window.endMinute <= 1440 &&
      window.startMinute < window.endMinute &&
      (index === 0 || sorted[index - 1].endMinute <= window.startMinute),
  );
}

function weeklyHoursAreValid(
  windows: ReadonlyArray<WeeklyBookingHoursWindow>,
): boolean {
  return dayOrder.every((dayOfWeek) =>
    windowsAreValid(windows.filter((window) => window.dayOfWeek === dayOfWeek)),
  );
}

function defaultWeeklyHours(): Array<WeeklyBookingHoursWindow> {
  return dayOrder
    .filter((dayOfWeek) => dayOfWeek >= 1 && dayOfWeek <= 5)
    .map((dayOfWeek) => ({
      dayOfWeek,
      startMinute: 9 * 60,
      endMinute: 17 * 60,
    }));
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

function dayLabel(dayIndex: number, lang: UiLocale): string {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(Date.UTC(2024, 0, 1 + dayIndex)));
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

function nextDateWithoutException(
  today: string,
  exceptions: ReadonlyArray<BookingHoursDateException>,
): string {
  const exceptionDates = new Set(exceptions.map((exception) => exception.date));
  for (let offset = 1; offset <= 365; offset += 1) {
    const date = addLocalDays(today, offset);
    if (!exceptionDates.has(date)) {
      return date;
    }
  }

  return addLocalDays(today, 1);
}

function newWindowAfter(windows: ReadonlyArray<TimeWindow>): TimeWindow {
  if (windows.length === 0) {
    return { startMinute: 9 * 60, endMinute: 17 * 60 };
  }

  const last = sortWindows(windows).at(-1);
  if (!last || last.endMinute >= 23 * 60) {
    return { startMinute: 8 * 60, endMinute: 9 * 60 };
  }

  const startMinute = Math.min(last.endMinute + 60, 23 * 60);
  return {
    startMinute,
    endMinute: Math.min(startMinute + 4 * 60, 23 * 60 + 59),
  };
}

function actionError(error: string): EditorError {
  return error === "INVALID_INPUT" ? "INVALID_INPUT" : "UNAVAILABLE";
}

export function AvailabilityEditor({
  copy,
  initial,
  lang,
  timeZone,
  onClose,
  onSaved,
}: AvailabilityEditorProps) {
  const [tab, setTab] = useState<"regular" | "exceptions">("regular");
  const [weeklyHours, setWeeklyHours] = useState(() =>
    initial.configured
      ? sortWeeklyHours(initial.weeklyHours)
      : defaultWeeklyHours(),
  );
  const [exceptions, setExceptions] = useState<
    Array<BookingHoursDateException>
  >([...initial.dateExceptions]);
  const [isSavingRegular, setIsSavingRegular] = useState(false);
  const [isSavingException, setIsSavingException] = useState(false);
  const [error, setError] = useState<EditorError>();
  const [message, setMessage] = useState<string>();
  const [exceptionDate, setExceptionDate] = useState(() =>
    nextDateWithoutException(initial.localToday, initial.dateExceptions),
  );
  const [exceptionMode, setExceptionMode] = useState<ExceptionMode>("closed");
  const [exceptionWindows, setExceptionWindows] = useState<Array<TimeWindow>>(
    [],
  );
  const [editingDate, setEditingDate] = useState<string>();

  useEffect(() => {
    if (initial.configured) {
      setWeeklyHours(sortWeeklyHours(initial.weeklyHours));
    }
  }, [initial.configured, initial.weeklyHours]);

  useEffect(() => {
    let active = true;
    void getAvailabilityFn({
      data: {
        from: initial.localToday,
        to: addLocalDays(initial.localToday, 365),
      },
    }).then((result) => {
      if (active && result.ok) {
        setExceptions([...result.value.dateExceptions]);
      }
    });

    return () => {
      active = false;
    };
  }, [initial.localToday]);

  const openDayCount = useMemo(
    () =>
      dayOrder.filter((dayOfWeek) =>
        weeklyHours.some((window) => window.dayOfWeek === dayOfWeek),
      ).length,
    [weeklyHours],
  );
  const regularInvalid = !weeklyHoursAreValid(weeklyHours);
  const exceptionInvalid =
    exceptionMode === "custom" &&
    (exceptionWindows.length === 0 || !windowsAreValid(exceptionWindows));

  function toggleDay(dayOfWeek: number) {
    setError(undefined);
    setMessage(undefined);
    setWeeklyHours((current) => {
      const isOpen = current.some((window) => window.dayOfWeek === dayOfWeek);
      return isOpen
        ? current.filter((window) => window.dayOfWeek !== dayOfWeek)
        : sortWeeklyHours([
            ...current,
            { dayOfWeek, startMinute: 9 * 60, endMinute: 17 * 60 },
          ]);
    });
  }

  function updateWeeklyWindow(
    dayOfWeek: number,
    index: number,
    field: "startMinute" | "endMinute",
    value: string,
  ) {
    const minute = timeToMinute(value);
    if (minute === undefined) {
      return;
    }

    setError(undefined);
    setMessage(undefined);
    setWeeklyHours((current) => {
      let dayIndex = -1;
      return current.map((window) => {
        if (window.dayOfWeek !== dayOfWeek) {
          return window;
        }
        dayIndex += 1;
        return dayIndex === index ? { ...window, [field]: minute } : window;
      });
    });
  }

  function addWeeklyWindow(dayOfWeek: number) {
    const currentDay = weeklyHours.filter(
      (window) => window.dayOfWeek === dayOfWeek,
    );
    setWeeklyHours((current) =>
      sortWeeklyHours([
        ...current,
        { dayOfWeek, ...newWindowAfter(currentDay) },
      ]),
    );
  }

  function removeWeeklyWindow(dayOfWeek: number, index: number) {
    let dayIndex = -1;
    setWeeklyHours((current) =>
      current.filter((window) => {
        if (window.dayOfWeek !== dayOfWeek) {
          return true;
        }
        dayIndex += 1;
        return dayIndex !== index;
      }),
    );
  }

  async function saveRegularHours() {
    if (regularInvalid) {
      setError("INVALID_INPUT");
      return;
    }

    setError(undefined);
    setMessage(undefined);
    setIsSavingRegular(true);
    try {
      const result = await replaceWeeklyBookingHoursFn({
        data: {
          windows: sortWeeklyHours(weeklyHours).map(
            ({ dayOfWeek, startMinute, endMinute }) => ({
              dayOfWeek,
              startMinute,
              endMinute,
            }),
          ),
        },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      setMessage(copy.saved);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingRegular(false);
    }
  }

  function selectExceptionMode(mode: ExceptionMode) {
    setExceptionMode(mode);
    setError(undefined);
    setMessage(undefined);
    if (mode === "custom" && exceptionWindows.length === 0) {
      const regular = regularHoursForDate(exceptionDate, weeklyHours);
      setExceptionWindows(
        regular.length > 0
          ? regular
          : [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
      );
    }
  }

  function updateExceptionWindow(
    index: number,
    field: "startMinute" | "endMinute",
    value: string,
  ) {
    const minute = timeToMinute(value);
    if (minute === undefined) {
      return;
    }
    setExceptionWindows((current) =>
      current.map((window, windowIndex) =>
        windowIndex === index ? { ...window, [field]: minute } : window,
      ),
    );
  }

  function resetExceptionForm(
    currentExceptions: ReadonlyArray<BookingHoursDateException> = exceptions,
  ) {
    setEditingDate(undefined);
    setExceptionDate(
      nextDateWithoutException(initial.localToday, currentExceptions),
    );
    setExceptionMode("closed");
    setExceptionWindows([]);
  }

  function editException(exception: BookingHoursDateException) {
    setTab("exceptions");
    setEditingDate(exception.date);
    setExceptionDate(exception.date);
    setExceptionMode(exception.windows.length === 0 ? "closed" : "custom");
    setExceptionWindows([...exception.windows]);
    setError(undefined);
    setMessage(undefined);
  }

  async function saveException() {
    if (exceptionInvalid) {
      setError("INVALID_INPUT");
      return;
    }

    setError(undefined);
    setMessage(undefined);
    setIsSavingException(true);
    try {
      const result = await upsertBookingHoursDateExceptionFn({
        data: {
          date: exceptionDate,
          windows:
            exceptionMode === "closed" ? [] : sortWindows(exceptionWindows),
        },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      const nextExceptions = [
        ...exceptions.filter((item) => item.date !== exceptionDate),
        result.value,
      ].sort((left, right) => left.date.localeCompare(right.date));
      setExceptions(nextExceptions);
      setMessage(copy.saved);
      resetExceptionForm(nextExceptions);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingException(false);
    }
  }

  async function removeException(exception: BookingHoursDateException) {
    if (!window.confirm(copy.removeConfirm)) {
      return;
    }

    setError(undefined);
    setMessage(undefined);
    try {
      const result = await deleteBookingHoursDateExceptionFn({
        data: { date: exception.date },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      setExceptions((current) =>
        current.filter((item) => item.date !== exception.date),
      );
      if (editingDate === exception.date) {
        resetExceptionForm();
      }
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    }
  }

  function renderTimeWindow(
    window: TimeWindow,
    index: number,
    update: (
      index: number,
      field: "startMinute" | "endMinute",
      value: string,
    ) => void,
    remove: (index: number) => void,
  ) {
    return (
      <div
        key={`${window.startMinute}-${window.endMinute}-${index}`}
        className="flex items-center gap-2"
      >
        <input
          type="time"
          step={900}
          value={minuteToTime(window.startMinute)}
          onChange={(event) => update(index, "startMinute", event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <input
          type="time"
          step={900}
          value={minuteToTime(window.endMinute)}
          onChange={(event) => update(index, "endMinute", event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
        <button
          type="button"
          onClick={() => remove(index)}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/30"
          aria-label={copy.removeHours}
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <section
      id="availability-editor"
      className="rounded-3xl border border-border bg-card p-5 shadow-[0_28px_70px_-48px_oklch(0.23_0.035_151/0.45)] sm:p-8"
    >
      <div className="flex items-start justify-between gap-5 pr-20 sm:pr-0">
        <div>
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
            {copy.title}
          </p>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {copy.description}
          </p>
          <p className="mt-2 flex items-start gap-2 text-muted-foreground text-sm">
            <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {copy.timeZoneOnly}{" "}
              <strong>{timeZone.replaceAll("_", " ")}</strong>
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={copy.close}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-7 flex gap-2 border-border border-b" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "regular"}
          onClick={() => setTab("regular")}
          className="border-transparent border-b-2 px-4 py-3 font-semibold text-sm aria-selected:border-primary aria-selected:text-primary"
        >
          <Clock3 aria-hidden="true" className="mr-2 inline size-4" />
          {copy.regularTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "exceptions"}
          onClick={() => setTab("exceptions")}
          className="border-transparent border-b-2 px-4 py-3 font-semibold text-sm aria-selected:border-primary aria-selected:text-primary"
        >
          <CalendarRange aria-hidden="true" className="mr-2 inline size-4" />
          {copy.exceptionsTab}
        </button>
      </div>

      {tab === "regular" ? (
        <div className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
                {copy.regularTitle}
              </h3>
              <p className="mt-2 text-muted-foreground text-sm">
                {copy.regularDescription}
              </p>
            </div>
            <span className="w-fit rounded-full bg-accent px-3 py-1.5 font-semibold text-primary text-xs">
              {openDayCount}/7 {copy.open.toLowerCase()}
            </span>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl bg-accent/70 p-4 text-primary text-sm">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{copy.serviceFit}</p>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
            {dayOrder.map((dayOfWeek, dayIndex) => {
              const dayWindows = weeklyHours.filter(
                (window) => window.dayOfWeek === dayOfWeek,
              );
              const isOpen = dayWindows.length > 0;
              return (
                <div
                  key={dayOfWeek}
                  className="grid gap-3 border-border border-b p-4 last:border-b-0 md:grid-cols-[160px_1fr_auto] md:items-start"
                >
                  <div className="flex items-center gap-3 pt-1.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOpen}
                      onClick={() => toggleDay(dayOfWeek)}
                      className={`relative h-6 w-11 rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 ${
                        isOpen ? "bg-primary" : "bg-muted-foreground/25"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                          isOpen ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span className="font-semibold capitalize">
                      {dayLabel(dayIndex, lang)}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {isOpen ? (
                      dayWindows.map((window, index) =>
                        renderTimeWindow(
                          window,
                          index,
                          (windowIndex, field, value) =>
                            updateWeeklyWindow(
                              dayOfWeek,
                              windowIndex,
                              field,
                              value,
                            ),
                          (windowIndex) =>
                            removeWeeklyWindow(dayOfWeek, windowIndex),
                        ),
                      )
                    ) : (
                      <p className="py-2 text-muted-foreground text-sm">
                        {copy.closed}
                      </p>
                    )}
                  </div>

                  {isOpen ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addWeeklyWindow(dayOfWeek)}
                    >
                      <Plus aria-hidden="true" />
                      {copy.addHours}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              size="lg"
              disabled={regularInvalid || isSavingRegular}
              onClick={saveRegularHours}
            >
              <Check aria-hidden="true" />
              {isSavingRegular ? copy.saving : copy.saveRegular}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          <h3 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
            {copy.exceptionsTitle}
          </h3>
          <p className="mt-2 max-w-3xl text-muted-foreground text-sm">
            {copy.exceptionsDescription}
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-background p-4 sm:p-5">
            <label className="block max-w-xs text-sm">
              <span className="font-semibold">{copy.date}</span>
              <input
                type="date"
                min={initial.localToday}
                max="2099-12-31"
                value={exceptionDate}
                disabled={editingDate !== undefined}
                onChange={(event) => {
                  const date = event.target.value;
                  setExceptionDate(date);
                  const existing = exceptions.find(
                    (exception) => exception.date === date,
                  );
                  if (existing) {
                    setEditingDate(existing.date);
                    setExceptionMode(
                      existing.windows.length === 0 ? "closed" : "custom",
                    );
                    setExceptionWindows([...existing.windows]);
                    return;
                  }

                  setEditingDate(undefined);
                  if (exceptionMode === "custom") {
                    const regular = regularHoursForDate(date, weeklyHours);
                    setExceptionWindows(
                      regular.length > 0
                        ? regular
                        : [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
                    );
                  }
                }}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 disabled:opacity-60"
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={exceptionMode === "closed" ? "default" : "outline"}
                onClick={() => selectExceptionMode("closed")}
              >
                {copy.closedAllDay}
              </Button>
              <Button
                type="button"
                variant={exceptionMode === "custom" ? "default" : "outline"}
                onClick={() => selectExceptionMode("custom")}
              >
                {copy.differentHours}
              </Button>
            </div>

            {exceptionMode === "custom" ? (
              <div className="mt-5 max-w-lg space-y-2">
                {exceptionWindows.map((window, index) =>
                  renderTimeWindow(
                    window,
                    index,
                    updateExceptionWindow,
                    (windowIndex) =>
                      setExceptionWindows((current) =>
                        current.filter((_, index) => index !== windowIndex),
                      ),
                  ),
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExceptionWindows((current) => [
                      ...current,
                      newWindowAfter(current),
                    ])
                  }
                >
                  <Plus aria-hidden="true" />
                  {copy.addHours}
                </Button>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {editingDate ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => resetExceptionForm()}
                >
                  {copy.cancel}
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={exceptionInvalid || isSavingException}
                onClick={saveException}
              >
                <Check aria-hidden="true" />
                {isSavingException
                  ? copy.saving
                  : editingDate
                    ? copy.updateException
                    : copy.addException}
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="font-heading font-semibold text-lg">
              {copy.upcomingExceptions}
            </h4>
            {exceptions.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-muted/60 p-4 text-muted-foreground text-sm">
                {copy.noExceptions}
              </p>
            ) : (
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
                {exceptions.map((exception) => (
                  <div
                    key={exception.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <p className="min-w-44 font-semibold capitalize">
                      {dateLabel(exception.date, lang)}
                    </p>
                    <p className="flex-1 text-muted-foreground text-sm">
                      {exception.windows.length === 0
                        ? copy.exceptionClosed
                        : exception.windows
                            .map(
                              (window) =>
                                `${minuteToTime(window.startMinute)}–${minuteToTime(window.endMinute)}`,
                            )
                            .join(", ")}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editException(exception)}
                      >
                        {copy.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeException(exception)}
                        aria-label={copy.remove}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-12 pt-4">
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive text-sm"
          >
            {error === "INVALID_INPUT"
              ? copy.errors.invalid
              : copy.errors.unavailable}
          </p>
        ) : message ? (
          <output className="rounded-xl bg-accent px-4 py-3 text-primary text-sm">
            {message}
          </output>
        ) : null}
      </div>
    </section>
  );
}
