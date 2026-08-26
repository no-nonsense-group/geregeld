import type {
  BookingHoursDateException,
  TimeWindow,
} from "#/contexts/availability/slices/manage-availability/contract";
import { addLocalDays } from "#/contexts/availability/slices/manage-availability/local-date";

export interface AvailabilityDateGroup {
  readonly from: string;
  readonly to: string;
  readonly windows: ReadonlyArray<TimeWindow>;
}

function windowsSignature(windows: ReadonlyArray<TimeWindow>): string {
  return JSON.stringify(
    [...windows]
      .sort((left, right) => left.startMinute - right.startMinute)
      .map(({ startMinute, endMinute }) => ({ startMinute, endMinute })),
  );
}

export function groupUpcomingDateExceptions(
  exceptions: ReadonlyArray<BookingHoursDateException>,
  localToday: string,
): Array<AvailabilityDateGroup> {
  const sorted = [...exceptions]
    .filter((exception) => exception.date >= localToday)
    .sort((left, right) => left.date.localeCompare(right.date));
  const groups: Array<AvailabilityDateGroup> = [];

  for (const exception of sorted) {
    const previous = groups.at(-1);
    if (
      previous &&
      exception.date === addLocalDays(previous.to, 1) &&
      windowsSignature(exception.windows) === windowsSignature(previous.windows)
    ) {
      groups[groups.length - 1] = { ...previous, to: exception.date };
      continue;
    }

    groups.push({
      from: exception.date,
      to: exception.date,
      windows: exception.windows,
    });
  }

  return groups;
}

export function dateGroupLabel(
  group: AvailabilityDateGroup,
  lang: string,
): string {
  const formatter = new Intl.DateTimeFormat(lang, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const from = new Date(`${group.from}T12:00:00.000Z`);
  if (group.from === group.to) return formatter.format(from);
  return formatter.formatRange(from, new Date(`${group.to}T12:00:00.000Z`));
}
