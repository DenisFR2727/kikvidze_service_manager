import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidPhoneInput,
  normalizePhone,
  sanitizePhoneInput,
} from "./phone.ts";

describe("sanitizePhoneInput", () => {
  it("keeps digits and common phone formatting characters", () => {
    assert.equal(
      sanitizePhoneInput("+380 (67) 111-22-33"),
      "+380 (67) 111-22-33",
    );
  });

  it("strips letters and symbols", () => {
    assert.equal(sanitizePhoneInput("abc+38067xyz!@#"), "+38067");
  });

  it("allows only one leading plus", () => {
    assert.equal(sanitizePhoneInput("++38067"), "+38067");
    assert.equal(sanitizePhoneInput("380+67"), "38067");
  });
});

describe("normalizePhone", () => {
  it("normalizes UA local numbers", () => {
    assert.equal(normalizePhone("0671112233"), "380671112233");
    assert.equal(normalizePhone("+380 67 111 22 33"), "380671112233");
  });
});

describe("isValidPhoneInput", () => {
  it("accepts valid phone numbers", () => {
    assert.equal(isValidPhoneInput("+380671112233"), true);
    assert.equal(isValidPhoneInput("0671112233"), true);
  });

  it("rejects too short numbers", () => {
    assert.equal(isValidPhoneInput("123"), false);
    assert.equal(isValidPhoneInput("abc"), false);
  });
});
