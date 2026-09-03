import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Job } from "../../../lib/types.ts";
import {
  parseNonNegativePrice,
  toDatetimeLocalValue,
} from "../jobFormShared.ts";
import {
  jobFormResetKey,
  jobToFormState,
  validateDetailForm,
  type DetailFormState,
} from "../jobDetailForm.ts";

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

function validForm(
  overrides: Partial<DetailFormState> = {},
): DetailFormState {
  return {
    phone: "+380501112233",
    name: "Оля",
    car: "BMW X5",
    category: "Пошив",
    scheduledAtLocal: "2026-08-12T13:00",
    completedAtLocal: "",
    workPrice: "1000",
    materialPrice: "200",
    status: "queued",
    ...overrides,
  };
}

describe("toDatetimeLocalValue", () => {
  it("returns empty string for null/undefined/invalid", () => {
    assert.equal(toDatetimeLocalValue(null), "");
    assert.equal(toDatetimeLocalValue(undefined), "");
    assert.equal(toDatetimeLocalValue("not-a-date"), "");
  });

  it("maps ISO to local datetime-local string", () => {
    const local = new Date(2026, 7, 12, 15, 30, 0, 0);
    const value = toDatetimeLocalValue(local.toISOString());
    assert.equal(value, "2026-08-12T15:30");
  });
});

describe("parseNonNegativePrice", () => {
  it("accepts integers and comma decimals", () => {
    assert.deepEqual(parseNonNegativePrice("10", "ціна"), {
      ok: true,
      value: 10,
    });
    assert.deepEqual(parseNonNegativePrice("10,5", "ціна"), {
      ok: true,
      value: 10.5,
    });
  });

  it("rejects empty, NaN, and negative", () => {
    assert.equal(parseNonNegativePrice("", "ціна").ok, false);
    assert.equal(parseNonNegativePrice("abc", "ціна").ok, false);
    assert.equal(parseNonNegativePrice("-1", "ціна").ok, false);
  });
});

describe("jobToFormState / jobFormResetKey", () => {
  it("maps job fields into form state", () => {
    const job = jobFixture({
      completedAt: new Date(2026, 7, 12, 18, 0).toISOString(),
      client: { id: "c1", phone: "+380671112233", name: null },
    });
    const form = jobToFormState(job);

    assert.equal(form.phone, "+380671112233");
    assert.equal(form.name, "");
    assert.equal(form.car, "BMW X5");
    assert.equal(form.workPrice, "1000");
    assert.equal(form.materialPrice, "200");
    assert.equal(form.completedAtLocal, "2026-08-12T18:00");
  });

  it("keeps reset key stable for same data with new object identity", () => {
    const a = jobFixture();
    const b = { ...a, client: { ...a.client } };
    assert.equal(jobFormResetKey(a), jobFormResetKey(b));
  });

  it("changes reset key when job content changes", () => {
    const a = jobFixture();
    const b = jobFixture({ workPrice: 1500 });
    assert.notEqual(jobFormResetKey(a), jobFormResetKey(b));
  });
});

describe("validateDetailForm", () => {
  it("returns payload for a valid form", () => {
    const { payload, errors } = validateDetailForm(validForm());
    assert.deepEqual(errors, {});
    assert.ok(payload);
    assert.equal(payload.phone, "+380501112233");
    assert.equal(payload.name, "Оля");
    assert.equal(payload.car, "BMW X5");
    assert.equal(payload.workPrice, 1000);
    assert.equal(payload.materialPrice, 200);
    assert.equal(payload.completedAt, null);
    assert.equal(payload.status, "queued");
    assert.ok(payload.scheduledAt);
  });

  it("requires phone, car, category, scheduledAt, workPrice", () => {
    const { payload, errors } = validateDetailForm(
      validForm({
        phone: "  ",
        car: "",
        category: "",
        scheduledAtLocal: "",
        workPrice: "",
        materialPrice: "-5",
      }),
    );
    assert.equal(payload, undefined);
    assert.ok(errors.phone);
    assert.ok(errors.car);
    assert.ok(errors.category);
    assert.ok(errors.scheduledAt);
    assert.ok(errors.workPrice);
    assert.ok(errors.materialPrice);
  });

  it("defaults empty materialPrice to 0", () => {
    const { payload, errors } = validateDetailForm(
      validForm({ materialPrice: "   " }),
    );
    assert.deepEqual(errors, {});
    assert.ok(payload);
    assert.equal(payload.materialPrice, 0);
  });

  it("maps empty name to null and completedAt when set", () => {
    const completedLocal = "2026-08-12T18:45";
    const { payload, errors } = validateDetailForm(
      validForm({
        name: "   ",
        completedAtLocal: completedLocal,
      }),
    );
    assert.deepEqual(errors, {});
    assert.equal(payload?.name, null);
    assert.equal(
      payload?.completedAt,
      new Date(completedLocal).toISOString(),
    );
  });

  it("rejects invalid completedAt", () => {
    const { payload, errors } = validateDetailForm(
      validForm({ completedAtLocal: "not-a-date" }),
    );
    assert.equal(payload, undefined);
    assert.ok(errors.completedAt);
  });
});
