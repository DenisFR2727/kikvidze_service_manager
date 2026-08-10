"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { JobStatusSelect } from "@/components/jobs/JobStatusSelect";
import { uk } from "@/lib/i18n/uk";
import type { Job, JobStatus } from "@/lib/types";
import {
  formatClient,
  formatDisplayAt,
  formatPrice,
} from "./jobListFormat";
import styles from "./JobList.module.scss";

export type JobListProps = {
  jobs: Job[];
  onStatusChange: (jobId: string, status: JobStatus) => Promise<Job>;
};

export function JobList({ jobs, onStatusChange }: JobListProps) {
  const titleId = useId();
  const [pendingIds, setPendingIds] = useState<Record<string, true>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  async function handleStatusChange(jobId: string, status: JobStatus) {
    setPendingIds((current) => ({ ...current, [jobId]: true }));
    setRowErrors((current) => {
      if (!(jobId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[jobId];
      return next;
    });

    try {
      await onStatusChange(jobId, status);
    } catch (err) {
      setRowErrors((current) => ({
        ...current,
        [jobId]:
          err instanceof Error ? err.message : uk.job.statusChangeFailed,
      }));
    } finally {
      setPendingIds((current) => {
        if (!(jobId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[jobId];
        return next;
      });
    }
  }

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
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
                  <JobStatusSelect
                    key={`${job.id}-${job.status}`}
                    value={job.status}
                    disabled={Boolean(pendingIds[job.id])}
                    aria-label={`${uk.job.status}: ${formatClient(job)}`}
                    onChange={(status) => handleStatusChange(job.id, status)}
                  />
                  <time
                    className={styles.datetime}
                    dateTime={job.displayAt}
                  >
                    {formatDisplayAt(job.displayAt)}
                  </time>
                </div>

                {rowErrors[job.id] ? (
                  <p className={styles.rowError} role="alert">
                    {rowErrors[job.id]}
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
