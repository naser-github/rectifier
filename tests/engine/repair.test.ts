import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  analyzeJsonRepair,
  classifyRepairEligibility,
} from "../../src/engine/repair/analyzeJson";
import { applySyntaxEdits } from "../../src/engine/repair/applyCandidate";
import {
  createDataFingerprint,
  fingerprintsEqual,
} from "../../src/engine/repair/fingerprint";
import { createSyntaxRepairCandidates } from "../../src/engine/repair/rules";
import { tokenizeRepairInput } from "../../src/engine/repair/tokenizer";
import { verifyRepairCandidate } from "../../src/engine/repair/verifyCandidate";
import { repairCases } from "../fixtures/repair-cases";

describe("repair safety fixture matrix", () => {
  it("contains every required fixture group with reasons", () => {
    const requiredGroups = ["safe", "ambiguous", "manual"] as const;

    for (const group of requiredGroups) {
      expect(repairCases[group].length).toBeGreaterThan(0);
    }

    for (const repairCase of Object.values(repairCases).flat()) {
      expect(repairCase.id).toMatch(/^[a-z0-9-]+$/u);
      expect(repairCase.input.length).toBeGreaterThan(0);
      expect(repairCase.expected.kind).toBeDefined();
      expect(repairCase.expected.reason.length).toBeGreaterThan(0);
    }
  });

  it("records required safe repair examples", () => {
    expect(repairCases.safe.map((repairCase) => repairCase.id)).toEqual(
      expect.arrayContaining([
        "missing-comma-between-properties",
        "trailing-comma-in-object",
        "missing-colon-after-key",
        "missing-closing-object-delimiter",
        "single-quote-string-delimiters",
      ]),
    );
  });

  it("records refused and adversarial cases that must not be repaired", () => {
    expect(repairCases.manual.map((repairCase) => repairCase.id)).toEqual(
      expect.arrayContaining([
        "single-quoted-unknown-structure",
        "unknown-bare-value",
        "adjacent-values-without-structure",
        "unterminated-string",
        "invalid-escape",
        "broken-unicode-escape",
        "number-rewrite-one-to-one-point-zero",
        "number-rewrite-exponent-to-integer",
        "string-rewrite-escaped-unicode",
      ]),
    );
  });
});

describe("repair tokenizer and data fingerprints", () => {
  it("records data token kind, decoded value, exact protected source content, range, and order", () => {
    const input = '{\'name\': \'John\', "active": true, "count": 1, "empty": null}';

    const tokens = tokenizeRepairInput(input);
    const dataTokens = tokens.filter((token) => token.kind !== "syntax");

    expect(dataTokens).toMatchObject([
      {
        decodedValue: "name",
        endOffset: 6,
        kind: "string",
        order: 0,
        source: "name",
        startOffset: 2,
      },
      {
        decodedValue: "John",
        endOffset: 14,
        kind: "string",
        order: 1,
        source: "John",
        startOffset: 10,
      },
      {
        decodedValue: "active",
        endOffset: 24,
        kind: "string",
        order: 2,
        source: "active",
        startOffset: 18,
      },
      {
        decodedValue: true,
        endOffset: 31,
        kind: "boolean",
        order: 3,
        source: "true",
        startOffset: 27,
      },
      {
        decodedValue: "count",
        endOffset: 39,
        kind: "string",
        order: 4,
        source: "count",
        startOffset: 34,
      },
      {
        decodedValue: 1,
        endOffset: 43,
        kind: "number",
        order: 5,
        source: "1",
        startOffset: 42,
      },
      {
        decodedValue: "empty",
        endOffset: 51,
        kind: "string",
        order: 6,
        source: "empty",
        startOffset: 46,
      },
      {
        decodedValue: null,
        endOffset: 58,
        kind: "null",
        order: 7,
        source: "null",
        startOffset: 54,
      },
    ]);

    expect(tokens.filter((token) => token.kind === "syntax")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "'", startOffset: 1 }),
        expect.objectContaining({ source: "'", startOffset: 6 }),
        expect.objectContaining({ source: "'", startOffset: 9 }),
        expect.objectContaining({ source: "'", startOffset: 14 }),
      ]),
    );
  });

  it("creates ordered data fingerprints and detects changed, reformatted, re-escaped, or reordered data", () => {
    expect(
      fingerprintsEqual(
        createDataFingerprint("{'name': 'John'}"),
        createDataFingerprint('{"name": "John"}'),
      ),
    ).toBe(true);

    expect(
      fingerprintsEqual(
        createDataFingerprint('{"amount": 1}'),
        createDataFingerprint('{"amount": 1.0}'),
      ),
    ).toBe(false);

    expect(
      fingerprintsEqual(
        createDataFingerprint('{"amount": 1e1}'),
        createDataFingerprint('{"amount": 10}'),
      ),
    ).toBe(false);

    expect(
      fingerprintsEqual(
        createDataFingerprint('{"letter": "a"}'),
        createDataFingerprint('{"letter": "\\u0061"}'),
      ),
    ).toBe(false);

    expect(
      fingerprintsEqual(
        createDataFingerprint('{"a": 1, "b": 2}'),
        createDataFingerprint('{"b": 2, "a": 1}'),
      ),
    ).toBe(false);
  });

  it("does not mutate input while tokenizing or fingerprinting", () => {
    const input = "{'name': 'John', \"count\": 1}";
    const original = input.slice();

    tokenizeRepairInput(input);
    createDataFingerprint(input);

    expect(input).toBe(original);
  });
});

describe("explicit syntax repair rules", () => {
  it("returns only explicit syntax edits for supported repair rules", () => {
    const cases = [
      {
        edit: { endOffset: 18, replacement: ",", startOffset: 18, type: "insert" },
        input: '{\n  "name": "John"\n  "active": true\n}',
        ruleId: "missing-comma",
      },
      {
        edit: { endOffset: 19, replacement: "", startOffset: 18, type: "remove" },
        input: '{\n  "name": "John",\n}',
        ruleId: "trailing-comma",
      },
      {
        edit: { endOffset: 10, replacement: ":", startOffset: 10, type: "insert" },
        input: '{\n  "name" "John"\n}',
        ruleId: "missing-colon",
      },
      {
        edit: { endOffset: 18, replacement: "}", startOffset: 18, type: "insert" },
        input: '{\n  "name": "John"',
        ruleId: "missing-closing-delimiter",
      },
    ] as const;

    for (const repairCase of cases) {
      expect(createSyntaxRepairCandidates(repairCase.input)).toContainEqual(
        expect.objectContaining({
          edits: [repairCase.edit],
          ruleId: repairCase.ruleId,
        }),
      );
    }
  });

  it("returns safe single-quote delimiter replacement edits only when the result is strict JSON", () => {
    expect(createSyntaxRepairCandidates("{'name': 'John'}")).toContainEqual({
      edits: [
        { endOffset: 2, replacement: '"', startOffset: 1, type: "replace" },
        { endOffset: 7, replacement: '"', startOffset: 6, type: "replace" },
        { endOffset: 10, replacement: '"', startOffset: 9, type: "replace" },
        { endOffset: 15, replacement: '"', startOffset: 14, type: "replace" },
      ],
      ruleId: "single-quote-delimiters",
      summary: "Replace single-quote string delimiters with JSON double quotes.",
    });

    expect(createSyntaxRepairCandidates("{'jhon'}")).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "single-quote-delimiters" }),
      ]),
    );
  });

  it("does not produce automatic syntax edits for unsupported or uncertain patterns", () => {
    const unsupportedInputs = [
      '{ "name": John }',
      "1 2",
      '{ "name": "Jo\\qhn" }',
      '{ "name": "\\u12" }',
      '{ "amount": 1. }',
      '{ "amount": 1e }',
    ];

    for (const input of unsupportedInputs) {
      expect(createSyntaxRepairCandidates(input)).toHaveLength(0);
    }
  });
});

describe("repair candidate generation, verification, and classification", () => {
  it("applies edits without mutating the original input", () => {
    const input = '{\n  "name": "John"\n  "active": true\n}';
    const original = input.slice();
    const repaired = applySyntaxEdits(input, [
      { endOffset: 18, replacement: ",", startOffset: 18, type: "insert" },
    ]);

    expect(input).toBe(original);
    expect(repaired).toBe('{\n  "name": "John",\n  "active": true\n}');
  });

  it("rejects edits that overlap protected data token content", () => {
    const input = '{"name": "John"}';
    const repaired = '{"name": "Jane"}';

    expect(
      verifyRepairCandidate(input, repaired, [
        { endOffset: 14, replacement: "ane", startOffset: 11, type: "replace" },
      ]),
    ).toMatchObject({
      dataPreserved: false,
      reason: "syntax-edit-overlaps-protected-data",
      result: "rejected",
    });
  });

  it("classifies every accepted safe fixture as one verified deterministic repair", () => {
    for (const repairCase of repairCases.safe) {
      const result = analyzeJsonRepair(repairCase.input);

      expect(result.kind, repairCase.id).toBe("safe");

      if (result.kind === "safe") {
        expect(JSON.parse(result.candidate.repairedText)).toBeDefined();
        expect(result.candidate.verification).toEqual({
          dataPreserved: true,
          exactSourcePreserved: true,
          result: "verified",
        });
      }
    }
  });

  it("classifies ambiguous fixtures without selecting one candidate", () => {
    for (const repairCase of repairCases.ambiguous) {
      const result = analyzeJsonRepair(repairCase.input);

      expect(result.kind, repairCase.id).toBe("ambiguous");

      if (result.kind === "ambiguous") {
        expect(result.choices.length).toBeGreaterThan(1);
        expect(
          result.choices.every((choice) => choice.verification.result === "verified"),
        ).toBe(true);
      }
    }
  });

  it("classifies unsupported, unsafe, and valid inputs as manual guidance", () => {
    for (const repairCase of repairCases.manual) {
      expect(analyzeJsonRepair(repairCase.input).kind, repairCase.id).toBe("manual");
    }

    expect(analyzeJsonRepair('{"name": "John"}')).toMatchObject({
      kind: "manual",
      reason: "valid-json",
    });
  });
});

describe("repair eligibility classification", () => {
  it("returns metadata for supported rules without exposing a repair candidate", () => {
    const eligibility = classifyRepairEligibility({
      diagnosticCode: "json.missing-comma",
      input: '{\n  "name": "John"\n  "active": true\n}',
    });

    expect(eligibility).toEqual({
      diagnosticCode: "json.missing-comma",
      isEligible: true,
      ruleId: "missing-comma",
    });
    expect("candidate" in eligibility).toBe(false);
    expect("choices" in eligibility).toBe(false);
    expect("repairedText" in eligibility).toBe(false);
    expect("edits" in eligibility).toBe(false);
  });

  it("returns unsupported metadata for unsupported diagnostics and valid JSON", () => {
    expect(
      classifyRepairEligibility({
        diagnosticCode: "json.invalid-escape",
        input: '{ "name": "Jo\\qhn" }',
      }),
    ).toEqual({
      diagnosticCode: "json.invalid-escape",
      isEligible: false,
      reason: "unsupported-diagnostic",
    });

    expect(
      classifyRepairEligibility({
        diagnosticCode: "json.missing-comma",
        input: '{"name": "John"}',
      }),
    ).toEqual({
      diagnosticCode: "json.missing-comma",
      isEligible: false,
      reason: "valid-json",
    });
  });

  it("keeps eligibility separate from user-triggered repair analysis", () => {
    const input = "{'jhon'}";

    expect(
      classifyRepairEligibility({
        diagnosticCode: "json.single-quote-delimiters",
        input,
      }),
    ).toEqual({
      diagnosticCode: "json.single-quote-delimiters",
      isEligible: true,
      ruleId: "single-quote-delimiters",
    });

    expect(analyzeJsonRepair(input)).toMatchObject({
      kind: "manual",
      reason: "unverified",
    });
  });
});

describe("repair safety audit", () => {
  it("does not mutate input during full repair analysis", () => {
    for (const repairCase of Object.values(repairCases).flat()) {
      const original = repairCase.input.slice();

      analyzeJsonRepair(repairCase.input);

      expect(repairCase.input, repairCase.id).toBe(original);
    }
  });

  it("keeps repair engine modules free of React, DOM, CodeMirror, and worker imports", () => {
    const repairDirectory = join(process.cwd(), "src/engine/repair");
    const sourceFiles = readdirSync(repairDirectory).filter((fileName) =>
      fileName.endsWith(".ts"),
    );
    const forbiddenPatterns = [
      /from\s+["']react["']/u,
      /from\s+["']@codemirror\//u,
      /Worker/u,
      /document\./u,
      /window\./u,
    ];

    for (const sourceFile of sourceFiles) {
      const content = readFileSync(join(repairDirectory, sourceFile), "utf8");

      for (const pattern of forbiddenPatterns) {
        expect(content, `${sourceFile} must not match ${pattern.source}`).not.toMatch(
          pattern,
        );
      }
    }
  });

  it("refuses equivalent-looking rewrites that change exact data source text", () => {
    expect(verifyRepairCandidate('{"amount": 1}', '{"amount": 1.0}', [])).toMatchObject(
      {
        dataPreserved: false,
        reason: "data-fingerprint-changed",
        result: "rejected",
      },
    );

    expect(
      verifyRepairCandidate('{"amount": 1e1}', '{"amount": 10}', []),
    ).toMatchObject({
      dataPreserved: false,
      reason: "data-fingerprint-changed",
      result: "rejected",
    });

    expect(
      verifyRepairCandidate('{"letter": "a"}', '{"letter": "\\u0061"}', []),
    ).toMatchObject({
      dataPreserved: false,
      reason: "data-fingerprint-changed",
      result: "rejected",
    });
  });
});
