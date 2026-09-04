"use client";

import { useId, useState } from "react";
import { JOB_STATUS_LABELS, uk } from "@/lib/i18n/uk";
import { JOB_STATUSES } from "@/lib/types";
import {
  hasActiveJobFilters,
  parseFilterStatus,
  withClampedDateRange,
  type JobFiltersValue,
} from "./jobFiltersQuery";
import styles from "./JobFilters.module.scss";

export type JobFiltersProps = {
  value: JobFiltersValue;
  categories: string[];
  onChange: (next: JobFiltersValue) => void;
  onReset: () => void;
  disabled?: boolean;
};

export function JobFilters({
  value,
  categories,
  onChange,
  onReset,
  disabled = false,
}: JobFiltersProps) {
  const idPrefix = useId();
  const titleId = `${idPrefix}-title`;
  const filtersId = `${idPrefix}-filters`;
  const statusId = `${idPrefix}-status`;
  const categoryId = `${idPrefix}-category`;
  const fromId = `${idPrefix}-from`;
  const toId = `${idPrefix}-to`;

  const [isExpanded, setIsExpanded] = useState(true);

  function patch(partial: Partial<JobFiltersValue>) {
    if (partial.from !== undefined || partial.to !== undefined) {
      onChange(withClampedDateRange(value, partial));
      return;
    }
    onChange({ ...value, ...partial });
  }

  const active = hasActiveJobFilters(value);

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {uk.job.filtersTitle}
        </h2>
        <div className={styles.headerActions}>
          {isExpanded ? (
            <button
              type="button"
              className={styles.reset}
              onClick={onReset}
              disabled={disabled || !active}
            >
              {uk.common.reset}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.toggleBtn}
            aria-expanded={isExpanded}
            aria-controls={filtersId}
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? uk.common.collapse : uk.common.expand}
          >
            <span
              className={styles.toggleArrow}
              aria-hidden="true"
              data-expanded={isExpanded}
            />
          </button>
        </div>
      </div>

      <div id={filtersId} className={styles.grid} hidden={!isExpanded}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={statusId}>
            {uk.job.status}
          </label>
          <select
            id={statusId}
            className={styles.input}
            value={value.status}
            disabled={disabled}
            onChange={(e) =>
              patch({ status: parseFilterStatus(e.target.value) })
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
          <label className={styles.label} htmlFor={categoryId}>
            {uk.job.categoryFilter}
          </label>
          <select
            id={categoryId}
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
          <label className={styles.label} htmlFor={fromId}>
            {uk.job.dateFrom}
          </label>
          <input
            id={fromId}
            className={styles.input}
            type="date"
            value={value.from}
            disabled={disabled}
            max={value.to || undefined}
            onChange={(e) => patch({ from: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={toId}>
            {uk.job.dateTo}
          </label>
          <input
            id={toId}
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
