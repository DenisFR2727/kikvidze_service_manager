"use client";

import { useState } from "react";
import Link from "next/link";
import {
  JOB_STATUS_LABELS,
  type Job,
  type JobStatus,
} from "@/lib/types";
import styles from "./JobCalendar.module.scss";

export type JobCalendarProps = {
  jobs: Job[];
};

const STATUS_CLASS: Record<JobStatus, string> = {
  queued: styles.statusQueued,
  in_progress: styles.statusInProgress,
  done: styles.statusDone,
  cancelled: styles.statusCancelled,
};

const DAY_MS = 24 * 60 * 60 * 1000;

type DayColumn = {
  key: string;
  date: Date;
  jobs: Job[];
  isToday: boolean;
};

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Monday 00:00 local for the week that contains `date`. */
function startOfWeekMonday(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + offset);
  return day;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth =
    weekStart.getMonth() === weekEnd.getMonth() &&
    weekStart.getFullYear() === weekEnd.getFullYear();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat("uk-UA", {
      month: "long",
      year: "numeric",
    }).format(weekStart);
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${monthYear}`;
  }

  const fmt = new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(weekStart)} – ${fmt.format(weekEnd)}`;
}

function formatDayHeading(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatClientShort(job: Job): string {
  const name = job.client.name?.trim();
  return name || job.client.phone;
}

function buildWeekDays(jobs: Job[], weekStart: Date): DayColumn[] {
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

export function JobCalendar({ jobs }: JobCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(new Date()),
  );

  const days = buildWeekDays(jobs, weekStart);
  const jobsInWeek = days.reduce((sum, day) => sum + day.jobs.length, 0);

  function goPrevWeek() {
    setWeekStart((current) => addDays(current, -7));
  }

  function goNextWeek() {
    setWeekStart((current) => addDays(current, 7));
  }

  function goThisWeek() {
    setWeekStart(startOfWeekMonday(new Date()));
  }

  return (
    <section className={styles.panel} aria-labelledby="job-calendar-title">
      <div className={styles.header}>
        <h2 id="job-calendar-title" className={styles.title}>
          Календар
        </h2>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={goPrevWeek}
            aria-label="Попередній тиждень"
          >
            ←
          </button>
          <div className={styles.weekLabel}>
            <span>{formatWeekRange(weekStart)}</span>
            <button
              type="button"
              className={styles.todayButton}
              onClick={goThisWeek}
            >
              Сьогодні
            </button>
          </div>
          <button
            type="button"
            className={styles.navButton}
            onClick={goNextWeek}
            aria-label="Наступний тиждень"
          >
            →
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className={styles.empty} role="status">
          Немає записів. Додайте першу роботу у формі вище.
        </p>
      ) : null}

      {jobs.length > 0 && jobsInWeek === 0 ? (
        <p className={styles.empty} role="status">
          Немає робіт на цей тиждень.
        </p>
      ) : null}

      <div className={styles.grid} role="list">
        {days.map((day) => (
          <div
            key={day.key}
            className={`${styles.day} ${day.isToday ? styles.dayToday : ""}`}
            role="listitem"
            aria-label={formatDayHeading(day.date)}
          >
            <div className={styles.dayHeader}>{formatDayHeading(day.date)}</div>

            <ul className={styles.events}>
              {day.jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className={`${styles.event} ${STATUS_CLASS[job.status]}`}
                    title={`${JOB_STATUS_LABELS[job.status]} · ${job.car}`}
                  >
                    <time
                      className={styles.eventTime}
                      dateTime={job.displayAt}
                    >
                      {formatTime(job.displayAt)}
                    </time>
                    <span className={styles.eventTitle}>
                      {formatClientShort(job)}
                    </span>
                    <span className={styles.eventMeta}>{job.car}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
