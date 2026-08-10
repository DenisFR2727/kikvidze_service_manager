"use client";

import { useState } from "react";
import Link from "next/link";
import { JOB_STATUS_LABELS, uk } from "@/lib/i18n/uk";
import type { Job, JobStatus } from "@/lib/types";
import { addDays, buildWeekDays, startOfWeekMonday } from "./jobCalendarWeek";
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
          {uk.job.calendarTitle}
        </h2>

        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={goPrevWeek}
            aria-label={uk.job.prevWeek}
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
              {uk.job.today}
            </button>
          </div>
          <button
            type="button"
            className={styles.navButton}
            onClick={goNextWeek}
            aria-label={uk.job.nextWeek}
          >
            →
          </button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <p className={styles.empty} role="status">
          {uk.job.emptyList}
        </p>
      ) : null}

      {jobs.length > 0 && jobsInWeek === 0 ? (
        <p className={styles.empty} role="status">
          {uk.job.emptyWeek}
        </p>
      ) : null}

      <div className={styles.grid}>
        {days.map((day) => (
          <div
            key={day.key}
            className={`${styles.day} ${day.isToday ? styles.dayToday : ""}`}
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
                    <time className={styles.eventTime} dateTime={job.displayAt}>
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
