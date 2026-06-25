import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { analyzeJsonRepair } from "../../src/engine/repair/analyzeJson";
import type {
  WorkerRequest,
  WorkerSourceRevision,
} from "../../src/domain/workerProtocol";
import {
  createInitialWorkerState,
  handleWorkerRequest,
} from "../../src/worker/json.worker";

const setSource = (revision: number, text: string): WorkerRequest => ({
  id: `job-set-${String(revision)}`,
  kind: "set-source",
  source: { revision, text },
});

const analyzeRepair = (id: string, source: WorkerSourceRevision): WorkerRequest => ({
  id,
  kind: "analyze-repair",
  source,
});

describe("repair-safety: set-source automatic path", () => {
  it("returns source-validated and never repair-analysis-complete for confirmed-invalid input", () => {
    const { response } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(1, "{'a': 1}"),
    );

    expect(response.kind).toBe("source-validated");
    expect(response.kind).not.toBe("repair-analysis-complete");
  });

  it("eligibility in source-validated response contains no candidate, repairedText, edits, result, or dialog keys", () => {
    const { response } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(1, "{'a': 1}"),
    );

    if (response.kind !== "source-validated") {
      throw new Error("expected source-validated");
    }

    const eligKeys = Object.keys(response.eligibility);
    expect(eligKeys).not.toContain("candidate");
    expect(eligKeys).not.toContain("repairedText");
    expect(eligKeys).not.toContain("edits");
    expect(eligKeys).not.toContain("result");
    expect(eligKeys).not.toContain("dialog");
  });

  it("carries no analysis or candidate in the response even when the input is repair-eligible", () => {
    const eligibleText = "{'a': 1, 'b': 2}";
    const { response } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(1, eligibleText),
    );

    if (response.kind !== "source-validated") {
      throw new Error("expected source-validated");
    }

    expect(response.eligibility.isEligible).toBe(true);

    const respKeys = Object.keys(response);
    expect(respKeys).not.toContain("analysis");
    expect(respKeys).not.toContain("candidate");
  });

  it("classifies the current revision text: different text produces different eligibility and diagnostics", () => {
    const { response: invalidResponse } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(1, "{'a': 1}"),
    );

    const { response: validResponse } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(2, '{"a": 1}'),
    );

    if (
      invalidResponse.kind !== "source-validated" ||
      validResponse.kind !== "source-validated"
    ) {
      throw new Error("expected source-validated");
    }

    expect(invalidResponse.eligibility.isEligible).toBe(true);
    expect(validResponse.eligibility.isEligible).toBe(false);
    expect(invalidResponse.diagnostics.length).toBeGreaterThan(0);
    expect(validResponse.diagnostics).toEqual([]);
    expect(invalidResponse.eligibility).not.toEqual(validResponse.eligibility);
  });
});

describe("repair-safety: analyze-repair is sole repair-analysis-complete path", () => {
  it("analyze-repair with matching revision yields repair-analysis-complete whose analysis deep-equals the engine result", () => {
    const text = "{'a': 1}";
    const stored = handleWorkerRequest(createInitialWorkerState(), setSource(3, text));

    const { response } = handleWorkerRequest(
      stored.state,
      analyzeRepair("job-analyze", { revision: 3, text }),
    );

    expect(response.kind).toBe("repair-analysis-complete");
    if (response.kind !== "repair-analysis-complete") {
      throw new Error("expected repair-analysis-complete");
    }

    expect(response.analysis).toEqual(analyzeJsonRepair(text));
    expect(response.revision).toBe(3);
  });

  it("stale analyze-repair returns failed and the response carries no analysis or candidate", () => {
    const stored = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(5, "{'a': 1}"),
    );

    const { response } = handleWorkerRequest(
      stored.state,
      analyzeRepair("job-stale", { revision: 4, text: "{'a': 1}" }),
    );

    expect(response.kind).toBe("failed");
    if (response.kind !== "failed") {
      throw new Error("expected failed");
    }

    const respKeys = Object.keys(response);
    expect(respKeys).not.toContain("analysis");
    expect(respKeys).not.toContain("candidate");
  });
});

describe("repair-safety: valid JSON eligibility", () => {
  it("valid JSON via set-source yields isEligible false with reason valid-json and no candidate or ruleId in eligibility", () => {
    const { response } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(1, '{"a": 1}'),
    );

    if (response.kind !== "source-validated") {
      throw new Error("expected source-validated");
    }

    expect(response.eligibility.isEligible).toBe(false);
    if (response.eligibility.isEligible) {
      throw new Error("expected ineligible");
    }
    expect(response.eligibility.reason).toBe("valid-json");

    const eligKeys = Object.keys(response.eligibility);
    expect(eligKeys).not.toContain("candidate");
    expect(eligKeys).not.toContain("ruleId");
  });
});

describe("repair-safety: worker source scan (complementing protocol.test.ts coverage)", () => {
  it("worker module does not import RepairCandidate or embed candidate-generation symbols", () => {
    const modulePath = join(process.cwd(), "src/worker/json.worker.ts");
    const source = readFileSync(modulePath, "utf8");

    expect(source).not.toMatch(/generateVerifiedRepairCandidates/u);
    expect(source).not.toMatch(/RepairCandidate/u);
  });
});
