/**
 * Shared frontend types aligned with `specs/001-client-job-booking/contracts/api.md`.
 */

export const JOB_STATUSES = [
  "queued",
  "in_progress",
  "done",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** @deprecated Import from `@/lib/i18n/uk` — kept for existing imports. */
export { JOB_STATUS_LABELS } from "@/lib/i18n/uk";

export type Admin = {
  login: string;
};

export type ClientSummary = {
  id: string;
  phone: string;
  name: string | null;
};

export type ClientListItem = ClientSummary & {
  jobsCount: number;
};

export type ClientDetail = ClientListItem & {
  /** Optional recent jobs when returned by `GET /api/clients/:id`. */
  recentJobs?: JobSummary[];
};

export type JobClientRef = {
  id: string;
  phone: string;
  name: string | null;
};

/** Job payload used in list, card, and create/update responses. */
export type Job = {
  id: string;
  client: JobClientRef;
  car: string;
  category: string;
  scheduledAt: string;
  completedAt: string | null;
  workPrice: number;
  materialPrice: number;
  status: JobStatus;
  /** Relevant datetime for list/calendar (FR-008). */
  displayAt: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Lightweight job row when embedded on a client detail. */
export type JobSummary = Pick<
  Job,
  "id" | "car" | "category" | "status" | "scheduledAt" | "displayAt"
>;

export type CreateJobInput = {
  phone: string;
  name?: string | null;
  car: string;
  category: string;
  scheduledAt: string;
  workPrice: number;
  materialPrice: number;
};

export type UpdateJobInput = Partial<{
  phone: string;
  name: string | null;
  car: string;
  category: string;
  scheduledAt: string;
  completedAt: string | null;
  workPrice: number;
  materialPrice: number;
  status: JobStatus;
}>;

export type JobsQuery = {
  status?: JobStatus;
  from?: string;
  to?: string;
  category?: string;
  q?: string;
  clientId?: string;
};

export type ListResponse<T> = {
  items: T[];
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type LoginResponse = {
  ok: true;
  admin: Admin;
};

export type MeResponse = {
  admin: Admin;
};

export type OkResponse = {
  ok: true;
};
