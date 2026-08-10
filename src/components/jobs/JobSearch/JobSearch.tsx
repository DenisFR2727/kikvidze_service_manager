"use client";

import { useEffect, useId, useRef, useState } from "react";
import { uk } from "@/lib/i18n/uk";
import styles from "./JobSearch.module.scss";

const DEFAULT_DEBOUNCE_MS = 300;

export type JobSearchProps = {
  /** Debounced search value used for API refetch. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  debounceMs?: number;
};

export function JobSearch({
  value,
  onChange,
  disabled = false,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: JobSearchProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const trimmed = draft.trim();
    const timer = window.setTimeout(() => {
      if (trimmed !== value.trim()) {
        onChangeRef.current(trimmed);
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, debounceMs, value]);

  function handleClear() {
    setDraft("");
    onChange("");
  }

  const showClear = draft.length > 0;

  return (
    <section className={styles.panel} aria-labelledby={`${inputId}-label`}>
      <label id={`${inputId}-label`} className={styles.label} htmlFor={inputId}>
        {uk.job.searchTitle}
      </label>
      <div className={styles.row}>
        <input
          id={inputId}
          className={styles.input}
          type="search"
          name="job-search"
          placeholder={uk.job.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          aria-describedby={`${inputId}-hint`}
        />
        {showClear ? (
          <button
            type="button"
            className={styles.clear}
            onClick={handleClear}
            disabled={disabled}
            aria-label={uk.job.searchClearAria}
          >
            {uk.common.clear}
          </button>
        ) : null}
      </div>
      <p id={`${inputId}-hint`} className={styles.hint}>
        {uk.job.searchHint}
      </p>
    </section>
  );
}
