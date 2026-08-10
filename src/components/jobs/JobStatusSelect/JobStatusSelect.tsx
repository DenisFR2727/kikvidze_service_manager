"use client";

import type { ChangeEvent } from "react";
import { JOB_STATUS_LABELS } from "@/lib/i18n/uk";
import { JOB_STATUSES, type JobStatus } from "@/lib/types";
import { parseJobStatus } from "./parseJobStatus";
import styles from "./JobStatusSelect.module.scss";

export type JobStatusSelectProps = {
  value: JobStatus;
  onChange: (status: JobStatus) => void | Promise<void>;
  disabled?: boolean;
  id?: string;
  /** Accessible name when no visible label is provided. */
  "aria-label"?: string;
};

const STATUS_CLASS: Record<JobStatus, string> = {
  queued: styles.statusQueued,
  in_progress: styles.statusInProgress,
  done: styles.statusDone,
  cancelled: styles.statusCancelled,
};

export function JobStatusSelect({
  value,
  onChange,
  disabled = false,
  id,
  "aria-label": ariaLabel,
}: JobStatusSelectProps) {
  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = parseJobStatus(event.target.value);
    if (next === null || next === value) {
      return;
    }
    await onChange(next);
  }

  return (
    <select
      id={id}
      className={`${styles.select} ${STATUS_CLASS[value]}`}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onChange={(event) => {
        void handleChange(event);
      }}
    >
      {JOB_STATUSES.map((status) => (
        <option key={status} value={status}>
          {JOB_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
