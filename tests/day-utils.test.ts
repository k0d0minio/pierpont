import { describe, expect, it } from "vitest";
import {
  addDays,
  formatYmd,
  getBrusselsYmd,
  getMonthDateRange,
  parseYmd,
} from "../src/lib/day-utils";

describe("day-utils", () => {
  it("round-trips a YYYY-MM-DD string", () => {
    expect(formatYmd(parseYmd("2026-03-01"))).toBe("2026-03-01");
  });

  it("adds days across a month end", () => {
    expect(formatYmd(addDays(parseYmd("2026-02-27"), 2))).toBe("2026-03-01");
  });

  it("reads the date in Brussels, not in UTC", () => {
    // 23:30 UTC on 31 December is already 1 January in Brussels (UTC+1).
    expect(getBrusselsYmd(new Date(Date.UTC(2025, 11, 31, 23, 30)))).toEqual({
      year: 2026,
      month: 1,
      day: 1,
    });
  });

  it("gives every day of the month", () => {
    const range = getMonthDateRange(parseYmd("2028-02-15"));
    expect(range.dates).toHaveLength(29);
    expect(formatYmd(range.startDate)).toBe("2028-02-01");
    expect(formatYmd(range.endDate)).toBe("2028-02-29");
  });
});
