import { describe, expect, it } from "vitest";

import type { BookingHoursDateException } from "#/contexts/availability/slices/manage-availability/contract";
import { groupUpcomingDateExceptions } from "./availability-date-groups";

function closed(date: string): BookingHoursDateException {
  return { id: date, date, windows: [] };
}

describe("groupUpcomingDateExceptions", () => {
  it("keeps separate days visible when the day between them is unchanged", () => {
    const groups = groupUpcomingDateExceptions(
      [closed("2026-08-31"), closed("2026-09-02")],
      "2026-08-26",
    );

    expect(groups.map(({ from, to }) => ({ from, to }))).toEqual([
      { from: "2026-08-31", to: "2026-08-31" },
      { from: "2026-09-02", to: "2026-09-02" },
    ]);
  });

  it("collapses consecutive days with the same change into one range", () => {
    const groups = groupUpcomingDateExceptions(
      [closed("2026-08-31"), closed("2026-09-01"), closed("2026-09-02")],
      "2026-08-26",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      from: "2026-08-31",
      to: "2026-09-02",
    });
  });
});
