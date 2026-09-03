import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_CREATE_FORM,
  emptyCreateForm,
  validateCreateForm,
  type CreateFormState,
} from "../jobCreateForm.ts";

function validForm(overrides: Partial<CreateFormState> = {}): CreateFormState {
  return {
    phone: "+380501112233",
    name: "Оля",
    car: "BMW X5",
    category: "Пошив",
    scheduledAtLocal: "2026-08-12T13:00",
    workPrice: "1000",
    materialPrice: "200",
    ...overrides,
  };
}

describe("EMPTY_CREATE_FORM", () => {
  it("is frozen and emptyCreateForm returns a fresh object", () => {
    assert.ok(Object.isFrozen(EMPTY_CREATE_FORM));
    const a = emptyCreateForm();
    const b = emptyCreateForm();
    assert.notEqual(a, b);
    assert.deepEqual(a, b);
  });
});

describe("validateCreateForm", () => {
  it("returns payload for a valid form", () => {
    const { payload, errors } = validateCreateForm(validForm());
    assert.deepEqual(errors, {});
    assert.ok(payload);
    assert.equal(payload.phone, "+380501112233");
    assert.equal(payload.name, "Оля");
    assert.equal(payload.car, "BMW X5");
    assert.equal(payload.category, "Пошив");
    assert.equal(payload.workPrice, 1000);
    assert.equal(payload.materialPrice, 200);
    assert.equal(
      payload.scheduledAt,
      new Date("2026-08-12T13:00").toISOString(),
    );
  });

  it("requires phone, car, category, scheduledAt, workPrice", () => {
    const { payload, errors } = validateCreateForm(
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
    const { payload, errors } = validateCreateForm(
      validForm({ materialPrice: "   " }),
    );
    assert.deepEqual(errors, {});
    assert.ok(payload);
    assert.equal(payload.materialPrice, 0);
  });

  it("rejects negative materialPrice", () => {
    const { payload, errors } = validateCreateForm(
      validForm({ materialPrice: "-5" }),
    );
    assert.equal(payload, undefined);
    assert.ok(errors.materialPrice);
  });

  it("rejects invalid phone", () => {
    const { payload, errors } = validateCreateForm(validForm({ phone: "123" }));
    assert.equal(payload, undefined);
    assert.ok(errors.phone);
  });

  it("rejects invalid scheduledAt", () => {
    const { payload, errors } = validateCreateForm(
      validForm({ scheduledAtLocal: "not-a-date" }),
    );
    assert.equal(payload, undefined);
    assert.ok(errors.scheduledAt);
  });

  it("omits empty name as undefined", () => {
    const { payload, errors } = validateCreateForm(validForm({ name: "   " }));
    assert.deepEqual(errors, {});
    assert.ok(payload);
    assert.equal(payload.name, undefined);
  });
});
