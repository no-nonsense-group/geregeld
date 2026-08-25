import { Dialog } from "@base-ui/react/dialog";
import {
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "#/components/ui/button";
import { organizationCopy } from "#/content/organization";
import type {
  AvailabilityOverview,
  AvailabilityPeriod,
  WeeklyRange,
} from "#/contexts/availability/slices/manage-availability/contract";
import {
  applyWeeklyAvailabilityFn,
  createAvailabilityPeriodFn,
  deleteAvailabilityPeriodFn,
  getAvailabilityFn,
  updateAvailabilityPeriodFn,
  updateDefaultAvailabilityDurationFn,
} from "#/contexts/availability/slices/manage-availability/functions";
import {
  addLocalDays,
  localDateDayOfWeek,
  localDateToEpochDay,
  localNow,
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

type EditorError = "INVALID_INPUT" | "CONFLICT" | "BULK_LIMIT" | "UNAVAILABLE";

interface ExactRangeInput {
  readonly dayOfWeek: number;
  readonly start: string;
  readonly end: string;
}

const dayOrder = [1, 2, 3, 4, 5, 6, 0] as const;
const durationPresets = [15, 30, 45, 60] as const;
const timelineSlots = Array.from({ length: 96 }, (_, index) => index);

function minuteToTime(minute: number): string {
  if (minute === 1440) {
    return "24:00";
  }

  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(
    minute % 60,
  ).padStart(2, "0")}`;
}

function timeToMinute(value: string): number | undefined {
  if (value === "24:00") {
    return 1440;
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return undefined;
  }

  return hour * 60 + minute;
}

function formatDuration(minutes: number, lang: UiLocale): string {
  if (minutes < 60) {
    return lang === "nl" ? `${minutes} minuten` : `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourText =
    lang === "nl"
      ? `${hours} ${hours === 1 ? "uur" : "uur"}`
      : `${hours} ${hours === 1 ? "hour" : "hours"}`;
  if (remainder === 0) {
    return hourText;
  }

  return `${hourText} ${remainder} min`;
}

function normalizeRanges(ranges: ReadonlyArray<WeeklyRange>) {
  const sorted = [...ranges].sort(
    (left, right) =>
      left.dayOfWeek - right.dayOfWeek || left.startMinute - right.startMinute,
  );
  const result: Array<WeeklyRange> = [];
  for (const range of sorted) {
    const previous = result.at(-1);
    if (
      previous &&
      previous.dayOfWeek === range.dayOfWeek &&
      range.startMinute <= previous.endMinute
    ) {
      result[result.length - 1] = {
        ...previous,
        endMinute: Math.max(previous.endMinute, range.endMinute),
      };
    } else {
      result.push(range);
    }
  }

  return result;
}

function generatedForRanges(
  ranges: ReadonlyArray<WeeklyRange>,
  durationMinutes: number,
) {
  const generated: Array<WeeklyRange> = [];
  for (const range of ranges) {
    for (
      let startMinute = range.startMinute;
      startMinute + durationMinutes <= range.endMinute;
      startMinute += durationMinutes
    ) {
      generated.push({
        dayOfWeek: range.dayOfWeek,
        startMinute,
        endMinute: startMinute + durationMinutes,
      });
    }
  }
  return generated;
}

function dateLabel(
  date: string,
  lang: UiLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...options,
  }).format(new Date(`${date}T12:00:00.000Z`));
}

function actionError(error: string): EditorError {
  if (
    error === "INVALID_INPUT" ||
    error === "CONFLICT" ||
    error === "BULK_LIMIT"
  ) {
    return error;
  }
  return "UNAVAILABLE";
}

export function AvailabilityEditor({
  copy,
  initial,
  lang,
  timeZone,
  onClose,
  onSaved,
}: AvailabilityEditorProps) {
  const [tab, setTab] = useState<"weekly" | "manual">("weekly");
  const [defaultDuration, setDefaultDuration] = useState(
    initial.defaultDurationMinutes,
  );
  const [duration, setDuration] = useState(initial.defaultDurationMinutes);
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<EditorError>();
  const [message, setMessage] = useState<string>();
  const [ranges, setRanges] = useState<Array<WeeklyRange>>([]);
  const [startDate, setStartDate] = useState(initial.localToday);
  const [endDate, setEndDate] = useState(addLocalDays(initial.localToday, 13));
  const [drag, setDrag] = useState<{
    dayOfWeek: number;
    startSlot: number;
    currentSlot: number;
  }>();
  const [exactDialogOpen, setExactDialogOpen] = useState(false);
  const [exactInput, setExactInput] = useState<ExactRangeInput>({
    dayOfWeek: 1,
    start: "09:00",
    end: "17:00",
  });
  const [exactInputInvalid, setExactInputInvalid] = useState(false);
  const [week, setWeek] = useState(initial);
  const [manualDate, setManualDate] = useState(
    addLocalDays(initial.localToday, 1),
  );
  const [manualStart, setManualStart] = useState("09:00");
  const [manualEnd, setManualEnd] = useState(
    minuteToTime(Math.min(540 + initial.defaultDurationMinutes, 1440)),
  );
  const [editingId, setEditingId] = useState<string>();
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);

  useEffect(() => {
    setDefaultDuration(initial.defaultDurationMinutes);
    setWeek((current) =>
      current.rangeFrom === initial.rangeFrom
        ? initial
        : {
            ...current,
            configured: initial.configured,
            defaultDurationMinutes: initial.defaultDurationMinutes,
            totalFuturePeriods: initial.totalFuturePeriods,
          },
    );
  }, [initial]);

  const generated = useMemo(
    () => generatedForRanges(ranges, duration),
    [duration, ranges],
  );
  const currentLocal = localNow(timeZone, new Date());
  const bulkCount = useMemo(() => {
    if (endDate < startDate) {
      return 0;
    }

    let count = 0;
    const startDay = localDateToEpochDay(startDate);
    const endDay = localDateToEpochDay(endDate);
    for (let day = startDay; day <= endDay; day += 1) {
      const date = addLocalDays(startDate, day - startDay);
      const dayOfWeek = localDateDayOfWeek(date);
      count += generated.filter(
        (period) =>
          period.dayOfWeek === dayOfWeek &&
          (date !== currentLocal.date ||
            period.startMinute > currentLocal.minute),
      ).length;
    }
    return count;
  }, [currentLocal.date, currentLocal.minute, endDate, generated, startDate]);

  const finishDraw = useCallback(() => {
    if (!drag) {
      return;
    }

    const first = Math.min(drag.startSlot, drag.currentSlot);
    const last = Math.max(drag.startSlot, drag.currentSlot);
    setRanges((current) =>
      normalizeRanges([
        ...current,
        {
          dayOfWeek: drag.dayOfWeek,
          startMinute: first * 15,
          endMinute: (last + 1) * 15,
        },
      ]),
    );
    setDrag(undefined);
  }, [drag]);

  useEffect(() => {
    if (!drag) {
      return;
    }

    window.addEventListener("pointerup", finishDraw, { once: true });
    return () => window.removeEventListener("pointerup", finishDraw);
  }, [drag, finishDraw]);

  function setPresetDuration(minutes: number) {
    setDuration(minutes);
  }

  function addExactRange() {
    const startMinute = timeToMinute(exactInput.start);
    const endMinute = timeToMinute(exactInput.end);
    if (
      startMinute === undefined ||
      endMinute === undefined ||
      startMinute >= endMinute ||
      startMinute >= 1440
    ) {
      setExactInputInvalid(true);
      return;
    }

    setExactInputInvalid(false);
    setError(undefined);
    setRanges((current) =>
      normalizeRanges([
        ...current,
        { dayOfWeek: exactInput.dayOfWeek, startMinute, endMinute },
      ]),
    );
    setExactDialogOpen(false);
  }

  async function saveDefaultDuration() {
    if (
      defaultDuration !== initial.defaultDurationMinutes &&
      !window.confirm(copy.defaultWarning)
    ) {
      return;
    }

    setError(undefined);
    setIsSavingDefault(true);
    try {
      const result = await updateDefaultAvailabilityDurationFn({
        data: { minutes: defaultDuration },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      setDuration(defaultDuration);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingDefault(false);
    }
  }

  async function loadWeek(from: string) {
    const result = await getAvailabilityFn({
      data: { from, to: addLocalDays(from, 6) },
    });
    if (result.ok) {
      setWeek(result.value);
    } else {
      setError(actionError(result.error));
    }
  }

  async function applyWeekly() {
    setError(undefined);
    setMessage(undefined);
    if (bulkCount === 0 || ranges.length === 0) {
      setError("INVALID_INPUT");
      return;
    }
    if (bulkCount > 1000) {
      setError("BULK_LIMIT");
      return;
    }

    setIsApplying(true);
    try {
      const existing = await getAvailabilityFn({
        data: { from: startDate, to: endDate },
      });
      if (!existing.ok) {
        setError(actionError(existing.error));
        return;
      }
      if (
        existing.value.periods.length > 0 &&
        !window.confirm(copy.replacementConfirm)
      ) {
        return;
      }

      const result = await applyWeeklyAvailabilityFn({
        data: {
          startDate,
          endDate,
          durationMinutes: duration,
          ranges,
        },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      setMessage(copy.setupComplete);
      await loadWeek(week.rangeFrom);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsApplying(false);
    }
  }

  function resetManualForm() {
    setEditingId(undefined);
    setManualDate(addLocalDays(initial.localToday, 1));
    setManualStart("09:00");
    setManualEnd(minuteToTime(Math.min(540 + defaultDuration, 1440)));
  }

  function editPeriod(period: AvailabilityPeriod) {
    setTab("manual");
    setEditingId(period.id);
    setManualDate(period.date);
    setManualStart(minuteToTime(period.startMinute));
    setManualEnd(minuteToTime(period.endMinute));
    setError(undefined);
    setMessage(undefined);
  }

  async function saveManualPeriod() {
    const startMinute = timeToMinute(manualStart);
    const endMinute = timeToMinute(manualEnd);
    if (
      startMinute === undefined ||
      endMinute === undefined ||
      startMinute >= endMinute ||
      startMinute >= 1440
    ) {
      setError("INVALID_INPUT");
      return;
    }

    setError(undefined);
    setMessage(undefined);
    setIsSavingPeriod(true);
    try {
      const result = editingId
        ? await updateAvailabilityPeriodFn({
            data: {
              id: editingId,
              date: manualDate,
              startMinute,
              endMinute,
            },
          })
        : await createAvailabilityPeriodFn({
            data: { date: manualDate, startMinute, endMinute },
          });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      setMessage(copy.setupComplete);
      resetManualForm();
      await loadWeek(week.rangeFrom);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    } finally {
      setIsSavingPeriod(false);
    }
  }

  async function removePeriod(period: AvailabilityPeriod) {
    if (!window.confirm(copy.removeConfirm)) {
      return;
    }

    setError(undefined);
    try {
      const result = await deleteAvailabilityPeriodFn({
        data: { id: period.id },
      });
      if (!result.ok) {
        setError(actionError(result.error));
        return;
      }

      await loadWeek(week.rangeFrom);
      await onSaved();
    } catch {
      setError("UNAVAILABLE");
    }
  }

  const manualStartMinute = timeToMinute(manualStart);
  const manualEndMinute = timeToMinute(manualEnd);
  const manualDuration =
    manualStartMinute !== undefined &&
    manualEndMinute !== undefined &&
    manualEndMinute > manualStartMinute
      ? manualEndMinute - manualStartMinute
      : undefined;

  return (
    <section
      id="availability-editor"
      className="rounded-3xl border border-border bg-card p-5 shadow-[0_28px_70px_-48px_oklch(0.23_0.035_151/0.45)] sm:p-8"
    >
      <div className="flex items-start justify-between gap-5 pr-36 sm:pr-44">
        <div>
          <p className="font-semibold text-primary text-sm uppercase tracking-[0.14em]">
            {copy.title}
          </p>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {copy.description}
          </p>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
            <Clock3 aria-hidden="true" className="size-4" />
            {copy.timeZoneOnly} <strong>{timeZone.replaceAll("_", " ")}</strong>
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

      <div className="mt-7 rounded-2xl bg-muted/65 p-4 sm:flex sm:items-end sm:justify-between sm:gap-6">
        <div>
          <label
            htmlFor="default-availability-duration"
            className="font-semibold text-sm"
          >
            {copy.defaultDuration}
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {durationPresets.map((minutes) => (
              <Button
                key={minutes}
                type="button"
                size="sm"
                variant={defaultDuration === minutes ? "default" : "outline"}
                onClick={() => setDefaultDuration(minutes)}
              >
                {minutes} min
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <input
                id="default-availability-duration"
                type="number"
                min={1}
                max={1440}
                value={defaultDuration}
                onChange={(event) =>
                  setDefaultDuration(Number(event.target.value))
                }
                className="h-9 w-24 rounded-xl border border-input bg-background px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
              <span className="text-muted-foreground text-sm">
                {copy.minutes}
              </span>
            </div>
          </div>
          {defaultDuration === 1440 ? (
            <p className="mt-2 max-w-xl text-amber-700 text-sm">
              {copy.fullDayWarning}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          className="mt-3 sm:mt-0"
          disabled={
            isSavingDefault ||
            defaultDuration < 1 ||
            defaultDuration > 1440 ||
            !Number.isInteger(defaultDuration) ||
            defaultDuration === initial.defaultDurationMinutes
          }
          onClick={saveDefaultDuration}
        >
          <Settings2 aria-hidden="true" />
          {isSavingDefault ? copy.saving : copy.saveDefault}
        </Button>
      </div>

      <div className="mt-7 flex gap-2 border-border border-b" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "weekly"}
          onClick={() => setTab("weekly")}
          className="border-transparent border-b-2 px-4 py-3 font-semibold text-sm aria-selected:border-primary aria-selected:text-primary"
        >
          <CalendarRange aria-hidden="true" className="mr-2 inline size-4" />
          {copy.weeklyTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "manual"}
          onClick={() => setTab("manual")}
          className="border-transparent border-b-2 px-4 py-3 font-semibold text-sm aria-selected:border-primary aria-selected:text-primary"
        >
          <Plus aria-hidden="true" className="mr-2 inline size-4" />
          {copy.manualTab}
        </button>
      </div>

      {tab === "weekly" ? (
        <div className="mt-7">
          <h3 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
            {copy.weeklyTitle}
          </h3>
          <p className="mt-2 max-w-3xl text-muted-foreground text-sm">
            {copy.weeklyDescription}
          </p>

          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-background p-4 lg:grid-cols-3">
            <label className="text-sm">
              <span className="font-semibold">{copy.startDate}</span>
              <input
                type="date"
                min={initial.localToday}
                max="2099-12-31"
                value={startDate}
                onChange={(event) => {
                  const next = event.target.value;
                  setStartDate(next);
                  const maximum = addLocalDays(next, 364);
                  if (endDate < next) {
                    setEndDate(next);
                  } else if (endDate > maximum) {
                    setEndDate(maximum);
                  }
                }}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
            </label>
            <label className="text-sm">
              <span className="font-semibold">{copy.endDate}</span>
              <input
                type="date"
                min={startDate}
                max={addLocalDays(startDate, 364)}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
              />
            </label>
            <div className="text-sm">
              <span className="font-semibold">{copy.durationForRun}</span>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={
                    durationPresets.includes(
                      duration as (typeof durationPresets)[number],
                    )
                      ? duration
                      : "custom"
                  }
                  onChange={(event) => {
                    if (event.target.value !== "custom") {
                      setPresetDuration(Number(event.target.value));
                    }
                  }}
                  className="h-11 rounded-xl border border-input bg-card px-3 outline-none focus:border-ring"
                >
                  {durationPresets.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                  <option value="custom">{copy.customDuration}</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 outline-none focus:border-ring"
                  aria-label={copy.durationForRun}
                />
              </div>
            </div>
          </div>

          {duration === 1440 ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-800 text-sm">
              {copy.fullDayWarning}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-muted-foreground text-sm">
              {copy.drawHint}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {ranges.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRanges([])}
                >
                  {copy.clearWeek}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-haspopup="dialog"
                aria-expanded={exactDialogOpen}
                onClick={() => {
                  setExactInputInvalid(false);
                  setExactDialogOpen(true);
                }}
              >
                <Plus aria-hidden="true" />
                {copy.addRange}
              </Button>
            </div>
          </div>

          <Dialog.Root
            open={exactDialogOpen}
            onOpenChange={(open) => {
              setExactDialogOpen(open);
              if (!open) {
                setExactInputInvalid(false);
              }
            }}
          >
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
              <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
                <Dialog.Popup className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl outline-none transition-[transform,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 sm:p-7">
                  <Dialog.Title className="pr-10 font-heading font-semibold text-2xl tracking-[-0.035em]">
                    {copy.exactRangeTitle}
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 pr-8 text-muted-foreground text-sm leading-relaxed">
                    {copy.exactRangeDescription}
                  </Dialog.Description>
                  <Dialog.Close
                    type="button"
                    className="absolute top-5 right-5 grid size-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                    aria-label={copy.cancel}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Dialog.Close>

                  <form
                    className="mt-6 grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addExactRange();
                    }}
                  >
                    <label className="text-sm">
                      <span className="font-semibold">{copy.day}</span>
                      <select
                        value={exactInput.dayOfWeek}
                        onChange={(event) => {
                          setExactInputInvalid(false);
                          setExactInput((current) => ({
                            ...current,
                            dayOfWeek: Number(event.target.value),
                          }));
                        }}
                        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
                      >
                        {dayOrder.map((dayOfWeek, index) => (
                          <option key={dayOfWeek} value={dayOfWeek}>
                            {
                              organizationCopy[lang].dashboard.weekdaysShort[
                                index
                              ]
                            }
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm">
                        <span className="font-semibold">{copy.startTime}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={exactInput.start}
                          onChange={(event) => {
                            setExactInputInvalid(false);
                            setExactInput((current) => ({
                              ...current,
                              start: event.target.value,
                            }));
                          }}
                          className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive"
                          placeholder="09:00"
                          aria-invalid={exactInputInvalid}
                        />
                      </label>
                      <label className="text-sm">
                        <span className="font-semibold">{copy.endTime}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={exactInput.end}
                          onChange={(event) => {
                            setExactInputInvalid(false);
                            setExactInput((current) => ({
                              ...current,
                              end: event.target.value,
                            }));
                          }}
                          className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive"
                          placeholder="17:00"
                          aria-invalid={exactInputInvalid}
                        />
                      </label>
                    </div>
                    {exactInputInvalid ? (
                      <p role="alert" className="text-destructive text-sm">
                        {copy.exactRangeError}
                      </p>
                    ) : null}
                    <div className="mt-1 flex justify-end gap-2">
                      <Dialog.Close
                        type="button"
                        className="inline-flex h-10 items-center justify-center rounded-full px-4 font-medium text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        {copy.cancel}
                      </Dialog.Close>
                      <Button type="submit" size="lg">
                        <Plus aria-hidden="true" />
                        {copy.addRange}
                      </Button>
                    </div>
                  </form>
                </Dialog.Popup>
              </Dialog.Viewport>
            </Dialog.Portal>
          </Dialog.Root>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-background">
            <div className="min-w-[720px] p-4">
              <div className="grid grid-cols-[52px_repeat(7,minmax(82px,1fr))]">
                <span className="self-end pb-3 text-muted-foreground text-[0.65rem] uppercase tracking-[0.08em]">
                  {copy.timeAxis}
                </span>
                {dayOrder.map((dayOfWeek, dayIndex) => {
                  const periodCount = generated.filter(
                    (period) => period.dayOfWeek === dayOfWeek,
                  ).length;
                  return (
                    <div
                      key={dayOfWeek}
                      className="flex min-w-0 items-center justify-center gap-1.5 px-1 pb-3 text-center"
                    >
                      <span className="truncate font-semibold text-sm">
                        {
                          organizationCopy[lang].dashboard.weekdaysShort[
                            dayIndex
                          ]
                        }
                      </span>
                      {periodCount > 0 ? (
                        <span className="rounded-full bg-accent px-1.5 py-0.5 font-semibold text-[0.65rem] text-primary tabular-nums">
                          {periodCount}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-[52px_repeat(7,minmax(82px,1fr))]">
                <div className="relative h-[576px] border-border border-r text-muted-foreground text-[0.65rem] tabular-nums">
                  {[0, 360, 720, 1080, 1440].map((minute) => (
                    <span
                      key={minute}
                      className={`absolute right-2 ${
                        minute === 0
                          ? "top-0"
                          : minute === 1440
                            ? "-translate-y-full"
                            : "-translate-y-1/2"
                      }`}
                      style={{ top: `${(minute / 1440) * 100}%` }}
                    >
                      {minuteToTime(minute)}
                    </span>
                  ))}
                </div>

                {dayOrder.map((dayOfWeek) => {
                  const dayGenerated = generated.filter(
                    (period) => period.dayOfWeek === dayOfWeek,
                  );
                  return (
                    <div
                      key={dayOfWeek}
                      className="relative h-[576px] overflow-hidden border-border border-r bg-muted/35 last:rounded-r-xl"
                    >
                      <div className="absolute inset-0 grid touch-none grid-rows-[repeat(96,minmax(0,1fr))] select-none">
                        {timelineSlots.map((slot) => (
                          <span
                            key={slot}
                            onPointerDown={(event: ReactPointerEvent) => {
                              if (event.button !== 0) {
                                return;
                              }
                              event.preventDefault();
                              setDrag({
                                dayOfWeek,
                                startSlot: slot,
                                currentSlot: slot,
                              });
                            }}
                            onPointerEnter={() => {
                              if (drag?.dayOfWeek === dayOfWeek) {
                                setDrag({ ...drag, currentSlot: slot });
                              }
                            }}
                            className={`cursor-crosshair border-b outline-none ${
                              (slot + 1) % 4 === 0
                                ? "border-border/70"
                                : "border-border/25"
                            }`}
                          />
                        ))}
                      </div>
                      {dayGenerated.map((period) => (
                        <span
                          key={`${period.startMinute}-${period.endMinute}`}
                          aria-hidden="true"
                          className="pointer-events-none absolute right-1 left-1 rounded-md bg-primary/85 ring-1 ring-primary-foreground/40"
                          style={{
                            top: `${(period.startMinute / 1440) * 100}%`,
                            height: `${((period.endMinute - period.startMinute) / 1440) * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-accent p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                {copy.periodsPreview(generated.length)}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {copy.bulkPreview(bulkCount)}
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              disabled={isApplying || bulkCount === 0 || bulkCount > 1000}
              onClick={applyWeekly}
            >
              <Check aria-hidden="true" />
              {isApplying ? copy.applyingWeekly : copy.applyWeekly}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          <h3 className="font-heading font-semibold text-2xl tracking-[-0.035em]">
            {copy.manualTitle}
          </h3>
          <p className="mt-2 text-muted-foreground text-sm">
            {copy.manualDescription}
          </p>

          <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-background p-4 md:grid-cols-4">
            <label className="text-sm">
              <span className="font-semibold">{copy.date}</span>
              <input
                type="date"
                min={initial.localToday}
                max="2099-12-31"
                value={manualDate}
                onChange={(event) => setManualDate(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3"
              />
            </label>
            <label className="text-sm">
              <span className="font-semibold">{copy.periodStart}</span>
              <input
                type="text"
                inputMode="numeric"
                value={manualStart}
                onChange={(event) => {
                  setManualStart(event.target.value);
                  const start = timeToMinute(event.target.value);
                  if (start !== undefined && start < 1440) {
                    setManualEnd(
                      minuteToTime(Math.min(start + defaultDuration, 1440)),
                    );
                  }
                }}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3"
                placeholder="09:00"
              />
            </label>
            <label className="text-sm">
              <span className="font-semibold">{copy.periodEnd}</span>
              <input
                type="text"
                inputMode="numeric"
                value={manualEnd}
                onChange={(event) => setManualEnd(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-card px-3"
                placeholder="09:30"
              />
            </label>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                className="h-11 flex-1"
                disabled={isSavingPeriod}
                onClick={saveManualPeriod}
              >
                {editingId ? copy.updatePeriod : copy.addPeriod}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  onClick={resetManualForm}
                >
                  {copy.cancelEdit}
                </Button>
              ) : null}
            </div>
          </div>
          {manualDuration !== undefined &&
          manualDuration !== defaultDuration ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-800 text-sm">
              {copy.longPeriod(formatDuration(manualDuration, lang))}
            </p>
          ) : null}

          <div className="mt-7 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadWeek(addLocalDays(week.rangeFrom, -7))}
              disabled={week.rangeFrom <= initial.localToday}
            >
              <ChevronLeft aria-hidden="true" />
              {copy.previousWeek}
            </Button>
            <p className="font-semibold text-sm">
              {dateLabel(week.rangeFrom, lang)} –{" "}
              {dateLabel(week.rangeTo, lang)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadWeek(addLocalDays(week.rangeFrom, 7))}
            >
              {copy.nextWeek}
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => {
              const date = addLocalDays(week.rangeFrom, index);
              const periods = week.periods.filter(
                (period) => period.date === date,
              );
              return (
                <article
                  key={date}
                  className="rounded-2xl border border-border bg-background p-3"
                >
                  <p className="font-semibold text-sm">
                    {dateLabel(date, lang, { weekday: "short" })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {dateLabel(date, lang)}
                  </p>
                  <div className="mt-3 space-y-2">
                    {periods.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        {copy.noPeriodsDay}
                      </p>
                    ) : (
                      periods.map((period) => (
                        <div
                          key={period.id}
                          className="rounded-xl bg-accent p-2"
                        >
                          <p className="font-semibold text-xs">
                            {minuteToTime(period.startMinute)}–
                            {minuteToTime(period.endMinute)}
                          </p>
                          <div className="mt-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => editPeriod(period)}
                              className="text-primary text-xs hover:underline"
                            >
                              {copy.edit}
                            </button>
                            <button
                              type="button"
                              onClick={() => removePeriod(period)}
                              className="ml-auto text-destructive"
                              aria-label={copy.remove}
                            >
                              <Trash2 aria-hidden="true" className="size-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
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
              : error === "CONFLICT"
                ? copy.errors.conflict
                : error === "BULK_LIMIT"
                  ? copy.errors.bulkLimit
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
