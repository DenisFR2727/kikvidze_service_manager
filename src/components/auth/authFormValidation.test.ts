import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "../../lib/api-client.ts";
import {
  AuthSubmitError,
  mapLoginApiError,
  mapRegisterApiError,
} from "./authApiErrors.ts";
import {
  MIN_PASSWORD_LENGTH,
  validateLoginForm,
  validateRegisterForm,
} from "./authFormValidation.ts";

describe("validateLoginForm", () => {
  it("returns payload for valid credentials", () => {
    const { payload, errors } = validateLoginForm({
      login: "  admin  ",
      password: "secret",
    });
    assert.deepEqual(errors, {});
    assert.deepEqual(payload, { login: "admin", password: "secret" });
  });

  it("requires login and password", () => {
    const { payload, errors } = validateLoginForm({
      login: "  ",
      password: "",
    });
    assert.equal(payload, undefined);
    assert.ok(errors.login);
    assert.ok(errors.password);
  });
});

describe("validateRegisterForm", () => {
  it("returns payload for valid credentials", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH);
    const { payload, errors } = validateRegisterForm({
      login: "new-admin",
      password,
      passwordConfirm: password,
    });
    assert.deepEqual(errors, {});
    assert.deepEqual(payload, { login: "new-admin", password });
  });

  it("requires all fields", () => {
    const { payload, errors } = validateRegisterForm({
      login: "",
      password: "",
      passwordConfirm: "",
    });
    assert.equal(payload, undefined);
    assert.ok(errors.login);
    assert.ok(errors.password);
    assert.ok(errors.passwordConfirm);
  });

  it("rejects mismatched passwords", () => {
    const password = "a".repeat(MIN_PASSWORD_LENGTH);
    const { payload, errors } = validateRegisterForm({
      login: "admin",
      password,
      passwordConfirm: "different-password",
    });
    assert.equal(payload, undefined);
    assert.ok(errors.passwordConfirm);
  });

  it("rejects short passwords", () => {
    const { payload, errors } = validateRegisterForm({
      login: "admin",
      password: "short",
      passwordConfirm: "short",
    });
    assert.equal(payload, undefined);
    assert.ok(errors.password);
  });
});

describe("mapLoginApiError", () => {
  it("maps unauthorized to invalid credentials", () => {
    const mapped = mapLoginApiError(
      new ApiError(401, "UNAUTHORIZED", "Invalid login or password"),
    );
    assert.ok(mapped instanceof AuthSubmitError);
    assert.equal(mapped.formError, "Невірний логін або пароль");
  });

  it("maps validation fields to login field errors", () => {
    const mapped = mapLoginApiError(
      new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        login: "Required",
      }),
    );
    assert.ok(mapped);
    assert.ok(mapped.fieldErrors?.login);
  });
});

describe("mapRegisterApiError", () => {
  it("maps conflict to login taken field error", () => {
    const mapped = mapRegisterApiError(
      new ApiError(409, "CONFLICT", "Already taken", {
        login: "Already taken",
      }),
    );
    assert.ok(mapped);
    assert.equal(mapped.fieldErrors?.login, "Цей логін уже зайнятий");
  });

  it("maps password validation to field error", () => {
    const mapped = mapRegisterApiError(
      new ApiError(400, "VALIDATION_ERROR", "Validation failed", {
        password: "Too short",
      }),
    );
    assert.ok(mapped);
    assert.ok(mapped.fieldErrors?.password);
  });
});
