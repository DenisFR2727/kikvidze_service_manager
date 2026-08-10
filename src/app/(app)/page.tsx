"use client";

import { JobForm } from "@/components/jobs/JobForm";
import { apiClient } from "@/lib/api-client";
import type { CreateJobInput, Job } from "@/lib/types";

export default function HomePage() {
  async function handleCreateJob(values: CreateJobInput) {
    await apiClient.post<Job>("/api/jobs", values);
  }

  return (
    <div className="home">
      <JobForm onSubmit={handleCreateJob} />
    </div>
  );
}
