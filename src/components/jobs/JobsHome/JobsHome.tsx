"use client";

import { JobCalendar } from "@/components/jobs/JobCalendar";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobForm } from "@/components/jobs/JobForm";
import { JobList } from "@/components/jobs/JobList";
import { JobSearch } from "@/components/jobs/JobSearch";
import { uk } from "@/lib/i18n/uk";
import { useJobsHome } from "./useJobsHome";

export function JobsHome() {
  const {
    view,
    setView,
    jobs,
    filters,
    search,
    setSearch,
    categories,
    isLoading,
    loadError,
    handleCreateJob,
    handleJobCreated,
    handleStatusChange,
    handleFiltersChange,
    handleFiltersReset,
  } = useJobsHome();

  return (
    <div className="home">
      <JobForm
        categories={categories}
        onSubmit={handleCreateJob}
        onCreated={handleJobCreated}
      />

      <JobSearch value={search} onChange={setSearch} />

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
