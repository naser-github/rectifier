import { describe, expect, it } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import type {
  RepairAnalysisResult,
  RepairEligibility,
  SyntaxEdit,
} from "../../src/domain/repair";
import type { ResultDocument } from "../../src/domain/result";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerSourceRevision,
} from "../../src/domain/workerProtocol";

describe("domain contracts", () => {
  it("models diagnostics with source position, reliability, and repair state", () => {
    const diagnostic = {
      code: "missing-comma",
      message: "Missing comma at line 3.",
      position: {
        line: 3,
        column: 5,
        offset: 42,
      },
      reliability: "confirmed",
      repairState: "eligible",
      severity: "error",
    } satisfies Diagnostic;

    expect(diagnostic.position.line).toBe(3);
    expect(diagnostic.repairState).toBe("eligible");
  });

  it("keeps repair eligibility separate from generated repair candidates", () => {
    const eligibility = {
      diagnosticCode: "missing-comma",
      isEligible: true,
      ruleId: "insert-missing-comma",
    } satisfies RepairEligibility;

    expect("candidate" in eligibility).toBe(false);
    expect(eligibility.isEligible).toBe(true);
  });

  it("models safe, ambiguous, and manual repair analysis outcomes", () => {
    const edit = {
      endOffset: 19,
      replacement: ",",
      startOffset: 19,
      type: "insert",
    } satisfies SyntaxEdit;

    const safe = {
      candidate: {
        edits: [edit],
        id: "candidate-1",
        repairedText: '{"a":1,"b":2}',
        summary: "Inserted one missing comma.",
        verification: {
          dataPreserved: true,
          exactSourcePreserved: true,
          result: "verified",
        },
      },
      kind: "safe",
    } satisfies RepairAnalysisResult;

    const ambiguous = {
      choices: [
        {
          edits: [edit],
          id: "choice-1",
          repairedText: '{"a":[1,2]}',
          summary: "Treat values as array items.",
          verification: {
            dataPreserved: true,
            exactSourcePreserved: true,
            result: "verified",
          },
        },
      ],
      kind: "ambiguous",
      manualGuidance: "Choose the intended structure or edit manually.",
    } satisfies RepairAnalysisResult;

    const manual = {
      guidance: "Edit the JSON manually.",
      kind: "manual",
      reason: "unsupported-syntax",
    } satisfies RepairAnalysisResult;

    expect([safe.kind, ambiguous.kind, manual.kind]).toEqual([
      "safe",
      "ambiguous",
      "manual",
    ]);
  });

  it("models result documents and revision-based worker messages", () => {
    const result = {
      action: "beautify",
      format: "json",
      revision: 2,
      text: '{\n  "name": "Rectifier"\n}',
    } satisfies ResultDocument;

    const sourceRevision = {
      revision: 2,
      text: '{"name":"Rectifier"}',
    } satisfies WorkerSourceRevision;

    const request = {
      id: "job-1",
      kind: "format",
      operation: "beautify",
      source: sourceRevision,
    } satisfies WorkerRequest;

    const validationRequest = {
      id: "job-2",
      kind: "validate-result",
      result,
    } satisfies WorkerRequest;

    const response = {
      id: "job-1",
      kind: "format-complete",
      result,
      revision: 2,
    } satisfies WorkerResponse;

    expect(request.source.revision).toBe(2);
    expect(validationRequest.kind).toBe("validate-result");
    expect(response.result.format).toBe("json");
  });
});
