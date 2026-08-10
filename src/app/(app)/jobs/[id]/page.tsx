"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { JobDetailCard } from "@/components/jobs/JobDetailCard";
import { ApiError, apiClient } from "@/lib/api-client";
import type { Job } from "@/lib/types";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = typeof params.id === "string" ? params.id : params.id?.[0];

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      setError("Невірний ідентифікатор роботи");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Job>(`/api/jobs/${jobId}`);
        if (!cancelled) {
          setJob(data);
        }
      } catch (err) {
        if (!cancelled) {
          setJob(null);
          if (err instanceof ApiError && err.code === "NOT_FOUND") {
            setError("Роботу не знайдено");
          } else {
            setError(
              err instanceof ApiError
                ? err.message
                : "Не вдалося завантажити картку роботи",
            );
          }
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
  }, [jobId]);

  function handleSaved(updated: Job) {
    setJob(updated);
  }

  function handleDeleted() {
    router.replace("/");
    router.refresh();
  }

  if (isLoading) {
    return (
      <p className="home__status" aria-busy="true" aria-live="polite">
        Завантаження картки…
      </p>
    );
  }

  if (error || !job) {
    return (
      <div className="home">
        <p className="home__error" role="alert">
          {error ?? "Роботу не знайдено"}
        </p>
        <p>
          <Link href="/">← Повернутися до списку</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="home">
      <JobDetailCard
        job={job}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
