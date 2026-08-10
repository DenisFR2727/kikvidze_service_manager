import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeJobSearch, shouldCommitJobSearch } from "./jobSearchQuery.ts";

describe("normalizeJobSearch", () => {
  it("trims leading and trailing whitespace", () => {
    assert.equal(normalizeJobSearch("  abc  "), "abc");
    assert.equal(normalizeJobSearch("\tphone\n"), "phone");
  });

  it("collapses whitespace-only input to empty", () => {
    assert.equal(normalizeJobSearch("   "), "");
    assert.equal(normalizeJobSearch(""), "");
  });
});

describe("shouldCommitJobSearch", () => {
  it("commits when normalized draft differs from committed", () => {
    assert.equal(shouldCommitJobSearch("ab", "a"), true);
    assert.equal(shouldCommitJobSearch("  ab  ", "a"), true);
    assert.equal(shouldCommitJobSearch("", "a"), true);
  });

  it("skips when normalized values match", () => {
    assert.equal(shouldCommitJobSearch("ab", "ab"), false);
    assert.equal(shouldCommitJobSearch("  ab  ", "ab"), false);
    assert.equal(shouldCommitJobSearch("   ", ""), false);
    assert.equal(shouldCommitJobSearch("", ""), false);
  });
});
