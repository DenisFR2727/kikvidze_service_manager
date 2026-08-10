import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Job } from "../../../lib/types";
import {
  addDays,
  buildWeekDays,
  startOfLocalDay,
  startOfWeekMonday,
  toDayKey,
} from "./jobCalendarWeek.ts";

function localDate(
  year: number,
  monthIndex: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  return new Date(year, monthIndex, day, hour, minute, 0, 0);
}

function jobFixture(
  overrides: Partial<Job> & Pick<Job, "id" | "displayAt">,
): Job {
  return {
    client: { id: "c1", phone: "+380501112233", name: "Client" },
    car: "Toyota",
    category: "service",
    scheduledAt: overrides.displayAt,
    completedAt: null,
    workPrice: 0,
    materialPrice: 0,
    status: "queued",
    ...overrides,
  };
}

describe("startOfWeekMonday", () => {
  it("returns Monday for a Wednesday", () => {
    const wednesday = localDate(2026, 7, 12); // Wed 12 Aug 2026
    const monday = startOfWeekMonday(wednesday);
    assert.equal(monday.getDay(), 1);
    assert.equal(toDayKey(monday), "2026-08-10");
    assert.equal(monday.getHours(), 0);
  });

  it("returns the same Monday when given Monday", () => {
    const monday = localDate(2026, 7, 10, 15, 45);
    const weekStart = startOfWeekMonday(monday);
    assert.equal(toDayKey(weekStart), "2026-08-10");
    assert.equal(weekStart.getHours(), 0);
  });

  it("maps Sunday back to the previous Monday", () => {
    const sunday = localDate(2026, 7, 16); // Sun 16 Aug 2026
    const monday = startOfWeekMonday(sunday);
    assert.equal(monday.getDay(), 1);
    assert.equal(toDayKey(monday), "2026-08-10");
  });
});

describe("addDays", () => {
  it("moves by calendar days and keeps local wall time", () => {
    const start = startOfLocalDay(localDate(2026, 2, 8)); // 8 Mar 2026
    const next = addDays(start, 1);

    assert.equal(toDayKey(next), "2026-03-09");
    assert.equal(next.getHours(), start.getHours());
    assert.equal(next.getMinutes(), start.getMinutes());
  });

  it("supports negative offsets across month boundaries", () => {
    const start = startOfLocalDay(localDate(2026, 2, 1));
    const prev = addDays(start, -1);
    assert.equal(toDayKey(prev), "2026-02-28");
  });

  it("builds seven consecutive local calendar days from week start", () => {
    // US spring-forward weekend historically breaks ms-based +24h math.
    const weekStart = startOfLocalDay(localDate(2024, 2, 10));
    const monday = startOfWeekMonday(weekStart);
    const keys = Array.from({ length: 7 }, (_, i) =>
      toDayKey(addDays(monday, i)),
    );

    assert.deepEqual(keys, [
      toDayKey(monday),
      toDayKey(addDays(monday, 1)),
      toDayKey(addDays(monday, 2)),
      toDayKey(addDays(monday, 3)),
      toDayKey(addDays(monday, 4)),
      toDayKey(addDays(monday, 5)),
      toDayKey(addDays(monday, 6)),
    ]);

    for (let i = 1; i < keys.length; i += 1) {
      assert.notEqual(keys[i], keys[i - 1]);
    }

    for (let i = 0; i < 7; i += 1) {
      const day = addDays(monday, i);
      assert.equal(day.getHours(), monday.getHours());
    }
  });
});

describe("buildWeekDays", () => {
  it("buckets and sorts jobs within the visible week", () => {
    const weekStart = startOfWeekMonday(localDate(2026, 7, 12));
    const tuesday = addDays(weekStart, 1);

    const later = jobFixture({
      id: "j2",
      displayAt: localDate(
        tuesday.getFullYear(),
        tuesday.getMonth(),
        tuesday.getDate(),
        14,
        0,
      ).toISOString(),
    });
    const earlier = jobFixture({
      id: "j1",
      displayAt: localDate(
        tuesday.getFullYear(),
        tuesday.getMonth(),
        tuesday.getDate(),
        9,
        30,
      ).toISOString(),
    });
    const outside = jobFixture({
      id: "j3",
      displayAt: addDays(weekStart, -3).toISOString(),
    });

    const days = buildWeekDays([later, earlier, outside], weekStart);

    assert.equal(days.length, 7);
    assert.equal(days[0]?.key, toDayKey(weekStart));
    assert.deepEqual(
      days[1]?.jobs.map((j) => j.id),
      ["j1", "j2"],
    );
    assert.equal(
      days.every((d) => d.jobs.every((j) => j.id !== "j3")),
      true,
    );
  });
});
