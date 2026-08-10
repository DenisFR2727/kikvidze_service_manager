"use client";

import { useState } from "react";
import { JobCalendar } from "@/components/jobs/JobCalendar";
import { JobForm } from "@/components/jobs/JobForm";
import { JobList } from "@/components/jobs/JobList";
import { apiClient } from "@/lib/api-client";
import type { CreateJobInput, Job } from "@/lib/types";

type HomeView = "list" | "calendar";

export default function HomePage() {
  const [view, setView] = useState<HomeView>("list");
  const jobs: Job[] = [];

  async function handleCreateJob(values: CreateJobInput): Promise<Job> {
    return apiClient.post<Job>("/api/jobs", values);
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
          {view === "list" ? (
            <JobList jobs={jobs} />
          ) : (
            <JobCalendar jobs={jobs} />
          )}
        </div>
      </section>
    </div>
  );
}
