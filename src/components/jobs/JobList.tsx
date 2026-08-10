import Link from "next/link";
import {
  JOB_STATUS_LABELS,
  type Job,
  type JobStatus,
} from "@/lib/types";
import styles from "./JobList.module.scss";

export type JobListProps = {
  jobs: Job[];
};

const STATUS_CLASS: Record<JobStatus, string> = {
  queued: styles.statusQueued,
  in_progress: styles.statusInProgress,
  done: styles.statusDone,
  cancelled: styles.statusCancelled,
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

export function JobList({ jobs }: JobListProps) {
  return (
    <section className={styles.panel} aria-labelledby="job-list-title">
      <h2 id="job-list-title" className={styles.title}>
        Список робіт
      </h2>

      {jobs.length === 0 ? (
        <p className={styles.empty} role="status">
          Немає записів. Додайте першу роботу у формі вище.
        </p>
      ) : (
        <ul className={styles.list}>
          {jobs.map((job) => (
            <li key={job.id} className={styles.item}>
              <Link href={`/jobs/${job.id}`} className={styles.row}>
                <div className={styles.primary}>
                  <span className={styles.client}>{formatClient(job)}</span>
                  <span className={styles.car}>{job.car}</span>
                </div>

                <div className={styles.meta}>
                  <span className={styles.category}>{job.category}</span>
                  <span className={styles.prices}>
                    Робота {formatPrice(job.workPrice)} · Матеріали{" "}
                    {formatPrice(job.materialPrice)}
                  </span>
                </div>

                <div className={styles.aside}>
                  <span
                    className={`${styles.status} ${STATUS_CLASS[job.status]}`}
                  >
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                  <time
                    className={styles.datetime}
                    dateTime={job.displayAt}
                  >
                    {formatDisplayAt(job.displayAt)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
