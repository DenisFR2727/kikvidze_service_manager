"use client";

import { useEffect, useState } from "react";
import { JobCalendar } from "@/components/jobs/JobCalendar";
import {
  EMPTY_JOB_FILTERS,
  JobFilters,
  jobFiltersToQuery,
  type JobFiltersValue,
} from "@/components/jobs/JobFilters";
import { JobForm } from "@/components/jobs/JobForm";
import { JobList } from "@/components/jobs/JobList";
import { JobSearch } from "@/components/jobs/JobSearch";
import { ApiError, apiClient } from "@/lib/api-client";
import { uk } from "@/lib/i18n/uk";
import type {
  CreateJobInput,
  Job,
  JobsQuery,
  JobStatus,
  ListResponse,
} from "@/lib/types";

type HomeView = "list" | "calendar";

function buildJobsQuery(
  filters: JobFiltersValue,
  search: string,
): JobsQuery {
  const query = jobFiltersToQuery(filters);
  const trimmed = search.trim();
  if (trimmed) {
    query.q = trimmed;
  }
  return query;
}

export default function HomePage() {
  const [view, setView] = useState<HomeView>("list");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFiltersValue>(EMPTY_JOB_FILTERS);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function fetchCategories(): Promise<void> {
    const data = await apiClient.get<ListResponse<string>>("/api/categories");
    setCategories(data.items);
  }

  async function fetchJobs(
    nextFilters: JobFiltersValue,
    nextSearch: string,
  ): Promise<void> {
    const data = await apiClient.get<ListResponse<Job>>("/api/jobs", {
      query: buildJobsQuery(nextFilters, nextSearch),
    });
    setJobs(data.items);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data =
          await apiClient.get<ListResponse<string>>("/api/categories");
        if (!cancelled) {
          setCategories(data.items);
        }
      } catch {
        // Category suggestions / filter options are optional on first paint.
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await apiClient.get<ListResponse<Job>>("/api/jobs", {
          query: buildJobsQuery(filters, search),
        });
        if (!cancelled) {
          setJobs(data.items);
          try {
            sessionStorage.removeItem("jobs-list-stale");
          } catch {
            // Ignore storage failures.
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : uk.app.loadJobsError,
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
  }, [filters, search]);

  // Soft-nav edge case: home kept mounted / restored — refetch after card edit/delete.
  useEffect(() => {
    function refreshIfStale() {
      try {
        if (sessionStorage.getItem("jobs-list-stale") !== "1") {
          return;
        }
        sessionStorage.removeItem("jobs-list-stale");
      } catch {
        return;
      }

      void apiClient
        .get<ListResponse<Job>>("/api/jobs", {
          query: buildJobsQuery(filters, search),
        })
        .then((data) => setJobs(data.items))
        .catch(() => {
          // Keep current list if refresh fails.
        });
    }

    refreshIfStale();
    window.addEventListener("focus", refreshIfStale);
    return () => window.removeEventListener("focus", refreshIfStale);
  }, [filters, search]);

  async function handleCreateJob(values: CreateJobInput): Promise<Job> {
    const created = await apiClient.post<Job>("/api/jobs", values);
    try {
      await fetchJobs(filters, search);
      setLoadError(null);
    } catch {
      setJobs((current) => [created, ...current]);
      setLoadError(null);
    }
    return created;
  }

  async function handleJobCreated(job: Job): Promise<void> {
    try {
      await fetchCategories();
    } catch {
      setCategories((current) => {
        if (current.includes(job.category)) {
          return current;
        }
        return [...current, job.category].sort((a, b) =>
          a.localeCompare(b, "uk"),
        );
      });
    }
  }

  async function handleStatusChange(
    jobId: string,
    status: JobStatus,
  ): Promise<Job> {
    const updated = await apiClient.patch<Job>(`/api/jobs/${jobId}`, {
      status,
    });

    const stillMatches =
      !filters.status || updated.status === filters.status;

    setJobs((current) => {
      if (!stillMatches) {
        return current.filter((job) => job.id !== jobId);
      }
      return current.map((job) => (job.id === jobId ? updated : job));
    });

    return updated;
  }

  function handleFiltersChange(next: JobFiltersValue) {
    setFilters(next);
  }

  function handleFiltersReset() {
    setFilters(EMPTY_JOB_FILTERS);
  }

  return (
    <div className="home">
      <JobForm
        categories={categories}
        onSubmit={handleCreateJob}
        onCreated={handleJobCreated}
      />

      <JobSearch value={search} onChange={setSearch} disabled={isLoading} />

      <JobFilters
        value={filters}
        categories={categories}
        onChange={handleFiltersChange}
        onReset={handleFiltersReset}
        disabled={isLoading}
      />

      <section className="home__board" aria-label={uk.app.jobsOverview}>
        <div
          className="home__switcher"
          role="tablist"
          aria-label={uk.app.viewSwitcher}
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
            {uk.app.listView}
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
            {uk.app.calendarView}
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
              {uk.app.loadingJobs}
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
