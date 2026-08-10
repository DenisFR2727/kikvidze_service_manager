"use client";

import Link from "next/link";
import { useState } from "react";
import { JobStatusSelect } from "@/components/jobs/JobStatusSelect";
import { JOB_STATUS_LABELS, uk } from "@/lib/i18n/uk";
import type { Job, JobStatus } from "@/lib/types";
import styles from "./JobList.module.scss";

export type JobListProps = {
  jobs: Job[];
  onStatusChange?: (jobId: string, status: JobStatus) => void | Promise<Job>;
};

function formatDisplayAt(iso: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatClient(job: Job): string {
  const { phone, name } = job.client;
  return name?.trim() ? `${phone} · ${name.trim()}` : phone;
}

export function JobList({ jobs, onStatusChange }: JobListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{
    jobId: string;
    message: string;
  } | null>(null);

  async function handleStatusChange(jobId: string, status: JobStatus) {
    if (!onStatusChange) {
      return;
    }

    setPendingId(jobId);
    setRowError(null);

    try {
      await onStatusChange(jobId, status);
    } catch (err) {
      setRowError({
        jobId,
        message:
          err instanceof Error
            ? err.message
            : uk.job.statusChangeFailed,
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="job-list-title">
      <h2 id="job-list-title" className={styles.title}>
        {uk.job.listTitle}
      </h2>

      {jobs.length === 0 ? (
        <p className={styles.empty} role="status">
          {uk.job.emptyList}
        </p>
      ) : (
        <ul className={styles.list}>
          {jobs.map((job) => (
            <li key={job.id} className={styles.item}>
              <div className={styles.row}>
                <Link href={`/jobs/${job.id}`} className={styles.rowMain}>
                  <div className={styles.primary}>
                    <span className={styles.client}>{formatClient(job)}</span>
                    <span className={styles.car}>{job.car}</span>
                  </div>

                  <div className={styles.meta}>
                    <span className={styles.category}>{job.category}</span>
                    <span className={styles.prices}>
                      {uk.common.workPriceShort} {formatPrice(job.workPrice)} ·{" "}
                      {uk.common.materialPriceShort}{" "}
                      {formatPrice(job.materialPrice)}
                    </span>
                  </div>
                </Link>

                <div className={styles.aside}>
                  {onStatusChange ? (
                    <JobStatusSelect
                      key={`${job.id}-${job.status}`}
                      value={job.status}
                      disabled={pendingId === job.id}
                      aria-label={`${uk.job.status}: ${formatClient(job)}`}
                      onChange={(status) => handleStatusChange(job.id, status)}
                    />
                  ) : (
                    <span className={styles.datetime}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  )}
                  <time
                    className={styles.datetime}
                    dateTime={job.displayAt}
                  >
                    {formatDisplayAt(job.displayAt)}
                  </time>
                </div>

                {rowError?.jobId === job.id ? (
                  <p className={styles.rowError} role="alert">
                    {rowError.message}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
