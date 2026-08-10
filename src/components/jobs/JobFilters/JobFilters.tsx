"use client";

import { JOB_STATUS_LABELS, uk } from "@/lib/i18n/uk";
import {
  JOB_STATUSES,
  type JobStatus,
  type JobsQuery,
} from "@/lib/types";
import styles from "./JobFilters.module.scss";

export type JobFiltersValue = {
  status: JobStatus | "";
  from: string;
  to: string;
  category: string;
};

export const EMPTY_JOB_FILTERS: JobFiltersValue = {
  status: "",
  from: "",
  to: "",
  category: "",
};

export type JobFiltersProps = {
  value: JobFiltersValue;
  categories: string[];
  onChange: (next: JobFiltersValue) => void;
  onReset: () => void;
  disabled?: boolean;
};

/** Convert panel state to API query (local day bounds for date inputs). */
export function jobFiltersToQuery(value: JobFiltersValue): JobsQuery {
  const query: JobsQuery = {};

  if (value.status) {
    query.status = value.status;
  }
  if (value.from) {
    query.from = new Date(`${value.from}T00:00:00`).toISOString();
  }
  if (value.to) {
    query.to = new Date(`${value.to}T23:59:59.999`).toISOString();
  }
  if (value.category.trim()) {
    query.category = value.category.trim();
  }

  return query;
}

export function hasActiveJobFilters(value: JobFiltersValue): boolean {
  return Boolean(
    value.status || value.from || value.to || value.category.trim(),
  );
}

export function JobFilters({
  value,
  categories,
  onChange,
  onReset,
  disabled = false,
}: JobFiltersProps) {
  function patch(partial: Partial<JobFiltersValue>) {
    onChange({ ...value, ...partial });
  }

  const active = hasActiveJobFilters(value);

  return (
    <section className={styles.panel} aria-labelledby="job-filters-title">
      <div className={styles.header}>
        <h2 id="job-filters-title" className={styles.title}>
          {uk.job.filtersTitle}
        </h2>
        <button
          type="button"
          className={styles.reset}
          onClick={onReset}
          disabled={disabled || !active}
        >
          {uk.common.reset}
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="job-filter-status">
            {uk.job.status}
          </label>
          <select
            id="job-filter-status"
            className={styles.input}
            value={value.status}
            disabled={disabled}
            onChange={(e) =>
              patch({ status: e.target.value as JobStatus | "" })
            }
          >
            <option value="">{uk.job.allStatuses}</option>
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {JOB_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="job-filter-category">
            {uk.job.categoryFilter}
          </label>
          <select
            id="job-filter-category"
            className={styles.input}
            value={value.category}
            disabled={disabled}
            onChange={(e) => patch({ category: e.target.value })}
          >
            <option value="">{uk.job.allCategories}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="job-filter-from">
            {uk.job.dateFrom}
          </label>
          <input
            id="job-filter-from"
            className={styles.input}
            type="date"
            value={value.from}
            disabled={disabled}
            onChange={(e) => patch({ from: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="job-filter-to">
            {uk.job.dateTo}
          </label>
          <input
            id="job-filter-to"
            className={styles.input}
            type="date"
            value={value.to}
            disabled={disabled}
            min={value.from || undefined}
            onChange={(e) => patch({ to: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
