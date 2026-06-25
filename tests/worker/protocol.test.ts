import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { analyzeJsonRepair } from "../../src/engine/repair/analyzeJson";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerSourceRevision,
} from "../../src/domain/workerProtocol";
import {
  createInitialWorkerState,
  handleWorkerRequest,
} from "../../src/worker/json.worker";
import type { WorkerLike } from "../../src/hooks/useWorkerClient";
import { createWorkerClient } from "../../src/hooks/useWorkerClient";

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

describe("handleWorkerRequest set-source", () => {
  it("stores the document and reports repair eligibility for an invalid revision", () => {
    const request = setSource(1, "{'a': 1}");

    const { state, response } = handleWorkerRequest(
      createInitialWorkerState(),
      request,
    );

    expect(response.kind).toBe("source-validated");
    if (response.kind !== "source-validated") {
      throw new Error("expected source-validated response");
    }
    expect(response.revision).toBe(1);
    expect(response.id).toBe(request.id);
    expect(state.source).toEqual({ revision: 1, text: "{'a': 1}" });
    // Eligibility comes from the pure engine, not invented here. The single-quote
    // input is eligible for the single-quote-delimiters rule.
    expect(response.eligibility).toEqual({
      diagnosticCode: "json.single-quote-delimiters",
      isEligible: true,
      ruleId: "single-quote-delimiters",
    });
  });

  it("does not invent diagnostics and reports engine valid-json eligibility for valid JSON", () => {
    const { response } = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(1, '{"a":1}'),
    );

    expect(response.kind).toBe("source-validated");
    if (response.kind !== "source-validated") {
      throw new Error("expected source-validated response");
    }
    expect(response.diagnostics).toEqual([]);
    // The engine reaches its valid-json short-circuit for valid input.
    expect(response.eligibility.isEligible).toBe(false);
    if (response.eligibility.isEligible) {
      throw new Error("expected ineligible result for valid JSON");
    }
    expect(response.eligibility.reason).toBe("valid-json");
  });
});

describe("handleWorkerRequest analyze-repair", () => {
  it("uses the stored latest revision for a matching analyze-repair", () => {
    const text = "{'a': 1}";
    const stored = handleWorkerRequest(createInitialWorkerState(), setSource(3, text));

    const { response } = handleWorkerRequest(
      stored.state,
      analyzeRepair("job-analyze", { revision: 3, text }),
    );

    expect(response.kind).toBe("repair-analysis-complete");
    if (response.kind !== "repair-analysis-complete") {
      throw new Error("expected repair-analysis-complete response");
    }
    expect(response.revision).toBe(3);
  });

  it("rejects a stale older revision without running the engine analysis path", () => {
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
      throw new Error("expected failed response");
    }
    expect(response.revision).toBe(5);
    expect(response.message.toLowerCase()).toContain("stale");
  });

  it("rejects an unknown revision before any source was stored", () => {
    const { state, response } = handleWorkerRequest(
      createInitialWorkerState(),
      analyzeRepair("job-unknown", { revision: 9, text: "{'a': 1}" }),
    );

    expect(response.kind).toBe("failed");
    if (response.kind !== "failed") {
      throw new Error("expected failed response");
    }
    expect(state.source).toBeNull();
  });

  it("returns exactly the pure engine analyzeJsonRepair result", () => {
    const text = "{'a': 1}";
    const stored = handleWorkerRequest(createInitialWorkerState(), setSource(2, text));

    const { response } = handleWorkerRequest(
      stored.state,
      analyzeRepair("job-delegate", { revision: 2, text }),
    );

    if (response.kind !== "repair-analysis-complete") {
      throw new Error("expected repair-analysis-complete response");
    }
    // The worker must not re-derive or alter the engine result.
    expect(response.analysis).toEqual(analyzeJsonRepair(text));
  });

  it("delegates to analyzeJsonRepair against the stored text, not the request text", () => {
    const storedText = "{'a': 1}";
    // A different text at the SAME revision: it must be ignored in favor of the
    // stored document. The two texts also yield different engine results, so a
    // regression that analyzed request.source.text would be caught.
    const requestText = '{"a":1}';
    expect(analyzeJsonRepair(requestText)).not.toEqual(analyzeJsonRepair(storedText));

    const stored = handleWorkerRequest(
      createInitialWorkerState(),
      setSource(7, storedText),
    );

    const { response } = handleWorkerRequest(
      stored.state,
      analyzeRepair("job-stored-text", { revision: 7, text: requestText }),
    );

    if (response.kind !== "repair-analysis-complete") {
      throw new Error("expected repair-analysis-complete response");
    }
    expect(response.analysis).toEqual(analyzeJsonRepair(storedText));
    expect(response.analysis).not.toEqual(analyzeJsonRepair(requestText));
  });
});

describe("json.worker module", () => {
  it("contains no repair-rule logic and only delegates to the engine", () => {
    const modulePath = join(process.cwd(), "src/worker/json.worker.ts");
    const source = readFileSync(modulePath, "utf8");

    // The worker must delegate, never duplicate repair rules.
    expect(source).toContain("analyzeJsonRepair");
    expect(source).toContain("classifyRepairEligibility");
    expect(source).not.toMatch(/generateVerifiedRepairCandidates/u);
    expect(source).not.toMatch(/verifyRepairCandidate/u);
    expect(source).not.toMatch(/createDataFingerprint/u);
    expect(source).not.toMatch(/createSyntaxRepairCandidates/u);
    expect(source).not.toMatch(/tokenizeRepairInput/u);
  });
});

class FakeWorker implements WorkerLike {
  public readonly posted: WorkerRequest[] = [];
  public terminated = false;
  public onmessage: ((event: { data: WorkerResponse }) => void) | null = null;

  public post(request: WorkerRequest): void {
    this.posted.push(request);
  }

  public terminate(): void {
    this.terminated = true;
  }

  public emit(response: WorkerResponse): void {
    this.onmessage?.({ data: response });
  }
}

describe("createWorkerClient stale handling", () => {
  it("surfaces only the latest job and ignores superseded job ids", () => {
    const worker = new FakeWorker();
    const received: WorkerResponse[] = [];
    const client = createWorkerClient(worker, (response) => {
      received.push(response);
    });

    const firstId = client.setSource({ revision: 1, text: "{'a': 1}" });
    const secondId = client.setSource({ revision: 2, text: "{'a': 2}" });

    // Late response from the superseded first job must be ignored.
    worker.emit({
      diagnostics: [],
      eligibility: {
        diagnosticCode: "json.single-quote-delimiters",
        isEligible: false,
        reason: "ambiguous-syntax",
      },
      id: firstId,
      kind: "source-validated",
      revision: 1,
    });

    worker.emit({
      diagnostics: [],
      eligibility: {
        diagnosticCode: "json.single-quote-delimiters",
        isEligible: false,
        reason: "ambiguous-syntax",
      },
      id: secondId,
      kind: "source-validated",
      revision: 2,
    });

    expect(received).toHaveLength(1);
    expect(received[0]?.id).toBe(secondId);
  });

  it("ignores responses from superseded revisions", () => {
    const worker = new FakeWorker();
    const received: WorkerResponse[] = [];
    const client = createWorkerClient(worker, (response) => {
      received.push(response);
    });

    client.setSource({ revision: 1, text: "{'a': 1}" });
    const analyzeId = client.analyzeRepair({ revision: 1, text: "{'a': 1}" });
    client.setSource({ revision: 2, text: "{'a': 2}" });

    // A response carrying the old revision must be dropped.
    worker.emit({
      analysis: analyzeJsonRepair("{'a': 1}"),
      id: analyzeId,
      kind: "repair-analysis-complete",
      revision: 1,
    });

    expect(received).toHaveLength(0);
  });

  it("assigns monotonically increasing job ids", () => {
    const worker = new FakeWorker();
    const client = createWorkerClient(worker, () => undefined);

    const first = client.setSource({ revision: 1, text: "{}" });
    const second = client.analyzeRepair({ revision: 1, text: "{}" });

    expect(worker.posted).toHaveLength(2);
    expect(worker.posted[0]?.id).toBe(first);
    expect(worker.posted[1]?.id).toBe(second);
    expect(first).not.toBe(second);
  });
});

describe("createWorkerClient lifecycle", () => {
  it("terminates the injected worker on dispose", () => {
    const worker = new FakeWorker();
    const terminateSpy = vi.spyOn(worker, "terminate");
    const client = createWorkerClient(worker, () => undefined);

    client.dispose();

    expect(terminateSpy).toHaveBeenCalledTimes(1);
    expect(worker.terminated).toBe(true);
  });
});
