import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { RepairAnalysisResult } from "../../src/domain/repair";
import type { ResultDocument } from "../../src/domain/result";
import type { WorkerRequest, WorkerResponse } from "../../src/domain/workerProtocol";

const dependencyCruiserConfig = readFileSync(
  resolve(process.cwd(), ".dependency-cruiser.mjs"),
  "utf8",
);

describe("architecture import boundaries", () => {
  it("configures dependency-cruiser rules for Rectifier source boundaries", () => {
    const requiredRules = [
      "no-circular",
      "no-engine-to-react",
      "no-engine-to-codemirror",
      "no-engine-to-ui-browser-worker",
      "no-domain-to-ui-or-browser",
      "no-domain-to-runtime-implementation",
      "no-broad-barrel-files",
    ];

    for (const rule of requiredRules) {
      expect(dependencyCruiserConfig).toContain(`name: "${rule}"`);
    }
  });

  it("covers every worker request and response variant with explicit result types", () => {
    const source = {
      revision: 1,
      text: '{"name":"Rectifier"}',
    };

    const result = {
      action: "beautify",
      format: "json",
      revision: 1,
      text: '{\n  "name": "Rectifier"\n}',
    } satisfies ResultDocument;

    const repairAnalysis = {
      guidance: "Edit the JSON manually.",
      kind: "manual",
      reason: "unsupported-syntax",
    } satisfies RepairAnalysisResult;

    const requests = [
      { id: "set-source", kind: "set-source", source },
      { id: "format", kind: "format", operation: "beautify", revision: 1 },
      { id: "analyze-repair", kind: "analyze-repair", source },
      { format: "yaml", id: "convert", kind: "convert", revision: 1 },
      {
        id: "validate-schema",
        kind: "validate-schema",
        revision: 1,
        schemaText: '{"type":"object"}',
      },
      { id: "validate-result", kind: "validate-result", result },
    ] satisfies readonly WorkerRequest[];

    const responses = [
      {
        diagnostics: [],
        eligibility: {
          diagnosticCode: "none",
          isEligible: false,
          reason: "valid-json",
        },
        id: "source-validated",
        kind: "source-validated",
        revision: 1,
      },
      { id: "format-complete", kind: "format-complete", result, revision: 1 },
      {
        analysis: repairAnalysis,
        id: "repair-analysis-complete",
        kind: "repair-analysis-complete",
        revision: 1,
      },
      { id: "conversion-complete", kind: "conversion-complete", result, revision: 1 },
      {
        diagnostics: [],
        id: "schema-validation-complete",
        kind: "schema-validation-complete",
        revision: 1,
      },
      {
        id: "result-validation-complete",
        kind: "result-validation-complete",
        result,
        valid: true,
      },
      { id: "failed", kind: "failed", message: "Unable to process JSON.", revision: 1 },
    ] satisfies readonly WorkerResponse[];

    expect(requests.map((request) => request.kind)).toEqual([
      "set-source",
      "format",
      "analyze-repair",
      "convert",
      "validate-schema",
      "validate-result",
    ]);
    expect(responses.map((response) => response.kind)).toEqual([
      "source-validated",
      "format-complete",
      "repair-analysis-complete",
      "conversion-complete",
      "schema-validation-complete",
      "result-validation-complete",
      "failed",
    ]);
  });
});
