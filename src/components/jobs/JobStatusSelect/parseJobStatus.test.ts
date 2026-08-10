import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseJobStatus } from "./parseJobStatus.ts";

describe("parseJobStatus", () => {
  it("accepts known statuses", () => {
    assert.equal(parseJobStatus("queued"), "queued");
    assert.equal(parseJobStatus("in_progress"), "in_progress");
    assert.equal(parseJobStatus("done"), "done");
    assert.equal(parseJobStatus("cancelled"), "cancelled");
  });

  it("rejects unknown or empty values", () => {
    assert.equal(parseJobStatus(""), null);
    assert.equal(parseJobStatus("nope"), null);
    assert.equal(parseJobStatus("QUEUED"), null);
    assert.equal(parseJobStatus("done "), null);
  });
});
