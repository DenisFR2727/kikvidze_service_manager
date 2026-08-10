import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Job } from "../../../lib/types.ts";
import {
  formatClient,
  formatDisplayAt,
  formatPrice,
} from "./jobListFormat.ts";

function jobFixture(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    client: { id: "c1", phone: "+380501112233", name: "Оля" },
    car: "BMW X5",
    category: "Пошив",
    scheduledAt: "2026-08-12T10:00:00.000Z",
    completedAt: null,
    workPrice: 1000,
    materialPrice: 200,
    status: "queued",
    displayAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T11:00:00.000Z",
    ...overrides,
  };
}

describe("formatClient", () => {
  it("joins phone and trimmed name", () => {
    assert.equal(
      formatClient(jobFixture()),
      "+380501112233 · Оля",
    );
  });

  it("returns phone only when name is missing or blank", () => {
    assert.equal(
      formatClient(
        jobFixture({ client: { id: "c1", phone: "+380501112233", name: null } }),
      ),
      "+380501112233",
    );
    assert.equal(
      formatClient(
        jobFixture({
          client: { id: "c1", phone: "+380501112233", name: "   " },
        }),
      ),
      "+380501112233",
    );
  });
});

describe("formatPrice", () => {
  it("formats integers with uk-UA grouping", () => {
    assert.equal(formatPrice(0), "0");
    assert.equal(formatPrice(12500), "12\u00A0500");
  });
});

describe("formatDisplayAt", () => {
  it("formats a local instant with uk-UA date and time", () => {
    const local = new Date(2026, 7, 12, 15, 30, 0, 0);
    const formatted = formatDisplayAt(local.toISOString());
    assert.equal(
      formatted,
      new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(local),
    );
    assert.match(formatted, /15:30/);
  });
});
