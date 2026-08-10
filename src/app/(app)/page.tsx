"use client";

import { useEffect, useState } from "react";
import { JobCalendar } from "@/components/jobs/JobCalendar";
import { JobForm } from "@/components/jobs/JobForm";
import { JobList } from "@/components/jobs/JobList";
import { ApiError, apiClient } from "@/lib/api-client";
import type { CreateJobInput, Job, JobStatus, ListResponse } from "@/lib/types";

type HomeView = "list" | "calendar";

export default function HomePage() {
  const [view, setView] = useState<HomeView>("list");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function fetchJobs(): Promise<void> {
    const data = await apiClient.get<ListResponse<Job>>("/api/jobs");
    setJobs(data.items);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await apiClient.get<ListResponse<Job>>("/api/jobs");
        if (!cancelled) {
          setJobs(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Не вдалося завантажити роботи",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateJob(values: CreateJobInput): Promise<Job> {
    const created = await apiClient.post<Job>("/api/jobs", values);
    try {
      await fetchJobs();
      setLoadError(null);
    } catch {
      setJobs((current) => [created, ...current]);
      setLoadError(null);
    }
    return created;
  }

  async function handleStatusChange(
    jobId: string,
    status: JobStatus,
  ): Promise<Job> {
    const updated = await apiClient.patch<Job>(`/api/jobs/${jobId}`, {
      status,
    });
    setJobs((current) =>
      current.map((job) => (job.id === jobId ? updated : job)),
    );
    return updated;
  }

  return (
    <div className="home">
      <JobForm onSubmit={handleCreateJob} />

      <section className="home__board" aria-label="Огляд робіт">
        <div
          className="home__switcher"
          role="tablist"
          aria-label="Вигляд робіт"
        >
          <button
            type="button"
            role="tab"
            id="home-view-list"
            aria-selected={view === "list"}
            aria-controls="home-view-panel"
            className={`home__switcher-btn${view === "list" ? " is-active" : ""}`}
            onClick={() => setView("list")}
          >
            Список
          </button>
          <button
            type="button"
            role="tab"
            id="home-view-calendar"
            aria-selected={view === "calendar"}
            aria-controls="home-view-panel"
            className={`home__switcher-btn${view === "calendar" ? " is-active" : ""}`}
            onClick={() => setView("calendar")}
          >
            Календар
          </button>
        </div>

        <div
          id="home-view-panel"
          role="tabpanel"
          aria-labelledby={
            view === "list" ? "home-view-list" : "home-view-calendar"
          }
        >
          {isLoading ? (
            <p className="home__status" aria-busy="true" aria-live="polite">
              Завантаження робіт…
            </p>
          ) : null}

          {loadError ? (
            <p className="home__error" role="alert">
              {loadError}
            </p>
          ) : null}

          {!isLoading && !loadError ? (
            view === "list" ? (
              <JobList jobs={jobs} onStatusChange={handleStatusChange} />
            ) : (
              <JobCalendar jobs={jobs} />
            )
          ) : null}
        </div>
      </section>
    </div>
  );
}
