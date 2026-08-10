import type { Job } from "../../../lib/types";

export type DayColumn = {
  key: string;
  date: Date;
  jobs: Job[];
  isToday: boolean;
};

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Monday 00:00 local for the week that contains `date`. */
export function startOfWeekMonday(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + offset);
  return day;
}

/** Calendar-day arithmetic (DST-safe). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildWeekDays(jobs: Job[], weekStart: Date): DayColumn[] {
  const todayKey = toDayKey(new Date());
  const byDay = new Map<string, Job[]>();

  for (const job of jobs) {
    const key = toDayKey(new Date(job.displayAt));
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.push(job);
    } else {
      byDay.set(key, [job]);
    }
  }

  for (const bucket of byDay.values()) {
    bucket.sort(
      (a, b) =>
        new Date(a.displayAt).getTime() - new Date(b.displayAt).getTime(),
    );
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const key = toDayKey(date);
    return {
      key,
      date,
      jobs: byDay.get(key) ?? [],
      isToday: key === todayKey,
    };
  });
}
