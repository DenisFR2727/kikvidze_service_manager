import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_JOB_FILTERS,
  hasActiveJobFilters,
  jobFiltersToQuery,
  parseFilterStatus,
  withClampedDateRange,
  type JobFiltersValue,
} from "./jobFiltersQuery.ts";

function filters(
  overrides: Partial<JobFiltersValue> = {},
): JobFiltersValue {
  return {
    status: "",
    from: "",
    to: "",
    category: "",
    ...overrides,
  };
}

describe("EMPTY_JOB_FILTERS", () => {
  it("is frozen", () => {
    assert.ok(Object.isFrozen(EMPTY_JOB_FILTERS));
  });
});

describe("parseFilterStatus", () => {
  it("accepts empty and known statuses", () => {
    assert.equal(parseFilterStatus(""), "");
    assert.equal(parseFilterStatus("queued"), "queued");
    assert.equal(parseFilterStatus("done"), "done");
  });

  it("rejects unknown values", () => {
    assert.equal(parseFilterStatus("nope"), "");
    assert.equal(parseFilterStatus("QUEUED"), "");
  });
});

describe("hasActiveJobFilters", () => {
  it("is false for empty filters", () => {
    assert.equal(hasActiveJobFilters(EMPTY_JOB_FILTERS), false);
    assert.equal(hasActiveJobFilters(filters({ category: "   " })), false);
  });

  it("is true when any field is set", () => {
    assert.equal(hasActiveJobFilters(filters({ status: "queued" })), true);
    assert.equal(hasActiveJobFilters(filters({ from: "2026-08-01" })), true);
    assert.equal(hasActiveJobFilters(filters({ to: "2026-08-02" })), true);
    assert.equal(hasActiveJobFilters(filters({ category: "Пошив" })), true);
  });
});

describe("withClampedDateRange", () => {
  it("bumps to when from moves past to", () => {
    const next = withClampedDateRange(
      filters({ from: "2026-08-01", to: "2026-08-05" }),
      { from: "2026-08-10" },
    );
    assert.deepEqual(next, {
      status: "",
      from: "2026-08-10",
      to: "2026-08-10",
      category: "",
    });
  });

  it("bumps from when to moves before from", () => {
    const next = withClampedDateRange(
      filters({ from: "2026-08-10", to: "2026-08-15" }),
      { to: "2026-08-01" },
    );
    assert.deepEqual(next, {
      status: "",
      from: "2026-08-01",
      to: "2026-08-01",
      category: "",
    });
  });

  it("leaves a valid range unchanged", () => {
    const base = filters({ from: "2026-08-01", to: "2026-08-05" });
    assert.deepEqual(withClampedDateRange(base, { from: "2026-08-03" }), {
      ...base,
      from: "2026-08-03",
    });
  });
});

describe("jobFiltersToQuery", () => {
  it("returns empty query for empty filters", () => {
    assert.deepEqual(jobFiltersToQuery(EMPTY_JOB_FILTERS), {});
  });

  it("maps status and trims category", () => {
    assert.deepEqual(
      jobFiltersToQuery(filters({ status: "in_progress", category: "  A  " })),
      { status: "in_progress", category: "A" },
    );
  });

  it("omits whitespace-only category", () => {
    assert.deepEqual(jobFiltersToQuery(filters({ category: "   " })), {});
  });

  it("maps local day bounds to inclusive ISO range", () => {
    const fromLocal = new Date(2026, 7, 12, 0, 0, 0, 0);
    const toLocal = new Date(2026, 7, 12, 23, 59, 59, 999);

    const query = jobFiltersToQuery(
      filters({ from: "2026-08-12", to: "2026-08-12" }),
    );

    assert.equal(query.from, fromLocal.toISOString());
    assert.equal(query.to, toLocal.toISOString());
    assert.ok(query.from);
    assert.ok(query.to);
    assert.ok(new Date(query.from).getTime() <= new Date(query.to).getTime());
  });

  it("maps single-bound dates", () => {
    const onlyFrom = jobFiltersToQuery(filters({ from: "2026-08-01" }));
    assert.equal(
      onlyFrom.from,
      new Date(2026, 7, 1, 0, 0, 0, 0).toISOString(),
    );
    assert.equal(onlyFrom.to, undefined);

    const onlyTo = jobFiltersToQuery(filters({ to: "2026-08-31" }));
    assert.equal(
      onlyTo.to,
      new Date(2026, 7, 31, 23, 59, 59, 999).toISOString(),
    );
    assert.equal(onlyTo.from, undefined);
  });
});
