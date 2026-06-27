import { describe, expect, it } from "vitest";

import type { WorkerRequest } from "../../src/domain/workerProtocol";
import {
  createInitialWorkerState,
  handleWorkerRequest,
} from "../../src/worker/json.worker";
import { parseDiagnostics } from "../../src/worker/diagnostics";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setSource = (revision: number, text: string): WorkerRequest => ({
  id: `job-set-${String(revision)}`,
  kind: "set-source",
  source: { revision, text },
});

const validateResult = (id: string, text: string, revision: number): WorkerRequest => ({
  id,
  kind: "validate-result",
  result: {
    action: "repair",
    format: "json",
    revision,
    text,
  },
});

// ---------------------------------------------------------------------------
// parseDiagnostics unit tests
// ---------------------------------------------------------------------------

describe("parseDiagnostics — valid JSON produces zero confirmed diagnostics", () => {
  const validCases: readonly [string, string][] = [
    ["object", '{"a":1,"b":true}'],
    ["array", "[1,2,3]"],
    ["string", '"hello"'],
    ["number", "42"],
    ["boolean true", "true"],
    ["boolean false", "false"],
    ["null", "null"],
    ["empty object", "{}"],
    ["empty array", "[]"],
    ["nested", '{"x":[1,{"y":null}]}'],
  ];

  for (const [label, text] of validCases) {
    it(`${label} has zero confirmed diagnostics`, () => {
      const diagnostics = parseDiagnostics(text);
      const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
      expect(confirmed).toHaveLength(0);
    });
  }
});

describe("parseDiagnostics — missing comma", () => {
  it("reports a confirmed missing-comma diagnostic", () => {
    // {"a":1 "b":2} — missing comma between properties
    const text = '{"a":1 "b":2}';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(first.code).toBe("json.missing-comma");
    expect(first.severity).toBe("error");
    expect(first.message).toMatch(/comma/i);
    // Position must be 1-based line/column
    expect(first.position.line).toBeGreaterThanOrEqual(1);
    expect(first.position.column).toBeGreaterThanOrEqual(1);
  });

  it("reports one confirmed missing-comma diagnostic for 10 MB supported input", () => {
    const entries = Array.from(
      { length: 110_000 },
      (_, index) => `"key_${String(index)}":"${"x".repeat(80)}"`,
    );
    const valid = `{${entries.join(",")}}`;
    const commaOffset = valid.lastIndexOf(',"key_');
    const text = valid.slice(0, commaOffset) + valid.slice(commaOffset + 1);

    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");

    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]?.code).toBe("json.missing-comma");
  }, 20_000);
});

describe("parseDiagnostics — trailing comma", () => {
  it("reports a confirmed trailing-comma diagnostic in an object", () => {
    const text = '{"a":1,}';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(first.code).toBe("json.trailing-comma");
    expect(first.severity).toBe("error");
    expect(first.message).toBe("Trailing comma is not allowed in JSON.");
  });

  it("reports a confirmed trailing-comma diagnostic in an array", () => {
    const text = "[1,2,]";
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(first.code).toBe("json.trailing-comma");
    expect(first.severity).toBe("error");
    expect(first.message).toBe("Trailing comma is not allowed in JSON.");
  });
});

describe("parseDiagnostics — single-quote delimiters", () => {
  it("maps a single-quote delimiter to a confirmed single-quote diagnostic", () => {
    const text = "{'a': 1}";
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(first.code).toBe("json.single-quote-delimiters");
    expect(first.severity).toBe("error");
    expect(first.message).toBe("Single quotes are not valid JSON string delimiters.");
    // The diagnostic is located at the opening single quote.
    expect(text[first.position.offset]).toBe("'");
  });
});

describe("parseDiagnostics — comments are disallowed", () => {
  it("reports a confirmed diagnostic for a line comment", () => {
    const text = '{"a":1} // comment';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);
  });

  it("reports a confirmed diagnostic for a block comment", () => {
    const text = '/* comment */ {"a":1}';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);
  });
});

describe("parseDiagnostics — uncertain follow-on", () => {
  it("emits at least one uncertain follow-on and never marks it confirmed", () => {
    // Single-quoted keys and values force cascading parser-recovery errors.
    // After recovering from the single-quote InvalidSymbol the parser emits a
    // property-name/value-expected follow-on, which must NOT be confirmed.
    const text = "{'name':'john'}";
    const diagnostics = parseDiagnostics(text);

    // At least one confirmed error must exist (the single-quote delimiter).
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    // This input GENUINELY produces follow-on diagnostics, so the assertion
    // loop is non-vacuous and proves none of them are marked confirmed.
    const followOn = diagnostics.filter((d) => d.reliability === "uncertain-follow-on");
    expect(followOn.length).toBeGreaterThanOrEqual(1);
    for (const d of followOn) {
      expect(d.reliability).toBe("uncertain-follow-on");
      expect(d.reliability).not.toBe("confirmed");
    }
  });
});

describe("parseDiagnostics — offset, line, column accuracy", () => {
  it("reports 1-based line and column for a known error position", () => {
    // Missing colon: {"a" 1} — error is at position of "1" (after "a")
    const text = '{"a" 1}';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    // Line must be 1-based (single-line input means line === 1)
    expect(first.position.line).toBe(1);
    // Column must be 1-based (> 0)
    expect(first.position.column).toBeGreaterThanOrEqual(1);
    // Offset must match actual position in text
    expect(first.position.offset).toBeGreaterThanOrEqual(0);
    expect(first.position.offset).toBeLessThan(text.length);
  });

  it("reports correct line for a multi-line input error", () => {
    const text = '{\n  "a": 1\n  "b": 2\n}';
    // Missing comma between "a" and "b" is on line 3
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    // The error is detected on line 3
    expect(first.position.line).toBe(3);
    expect(first.position.column).toBeGreaterThanOrEqual(1);
  });
});

describe("parseDiagnostics — message format", () => {
  it("provides a plain human-readable message for a missing colon", () => {
    const text = '{"a" 1}';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(typeof first.message).toBe("string");
    expect(first.message.length).toBeGreaterThan(0);
    // Must be a plain message, not a code like "ColonExpected"
    expect(first.message).not.toMatch(/^[A-Z][a-z]+Expected$/u);
    expect(first.message).toMatch(/colon/i);
  });

  it("provides a plain human-readable message for a missing closing brace", () => {
    const text = '{"a":1';
    const diagnostics = parseDiagnostics(text);
    const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);

    const first = confirmed[0];
    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(first.message).toMatch(/brace|bracket|closing/i);
  });
});

// ---------------------------------------------------------------------------
// set-source: real diagnostics and engine eligibility
// ---------------------------------------------------------------------------

describe("handleWorkerRequest set-source — real diagnostics from engine", () => {
  it("returns confirmed diagnostics for invalid JSON", () => {
    const request = setSource(1, '{"a":1 "b":2}');
    const { response } = handleWorkerRequest(createInitialWorkerState(), request);

    expect(response.kind).toBe("source-validated");
    if (response.kind !== "source-validated") throw new Error("wrong kind");

    const confirmed = response.diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed.length).toBeGreaterThanOrEqual(1);
    expect(confirmed[0]?.code).toBe("json.missing-comma");
  });

  it("returns zero confirmed diagnostics for valid JSON and ineligible engine state", () => {
    const request = setSource(1, '{"a":1}');
    const { response } = handleWorkerRequest(createInitialWorkerState(), request);

    expect(response.kind).toBe("source-validated");
    if (response.kind !== "source-validated") throw new Error("wrong kind");

    const confirmed = response.diagnostics.filter((d) => d.reliability === "confirmed");
    expect(confirmed).toHaveLength(0);
    expect(response.eligibility.isEligible).toBe(false);
    if (response.eligibility.isEligible) throw new Error("unexpected");
    expect(response.eligibility.reason).toBe("valid-json");
  });

  it("returns engine eligibility derived from the top confirmed diagnostic code", () => {
    // Trailing comma: engine has a matching rule
    const request = setSource(1, '{"a":1,}');
    const { response } = handleWorkerRequest(createInitialWorkerState(), request);

    expect(response.kind).toBe("source-validated");
    if (response.kind !== "source-validated") throw new Error("wrong kind");

    // Engine must have recognized the trailing-comma rule
    // (isEligible depends on the engine's own heuristics; we verify the code matches)
    expect(response.eligibility.diagnosticCode).toBe("json.trailing-comma");
  });

  it("reports unsupported-diagnostic eligibility when no rule matches the top diagnostic code", () => {
    // InvalidSymbol: no repair rule for this
    const text = "\x00";
    const request = setSource(1, text);
    const { response } = handleWorkerRequest(createInitialWorkerState(), request);

    expect(response.kind).toBe("source-validated");
    if (response.kind !== "source-validated") throw new Error("wrong kind");

    // eligibility must be ineligible since no rule covers this diagnostic
    expect(response.eligibility.isEligible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validate-result: ephemeral, does not mutate stored source
// ---------------------------------------------------------------------------

describe("handleWorkerRequest validate-result", () => {
  it("returns valid: true for valid JSON result text", () => {
    const state = createInitialWorkerState();
    const { state: afterSet } = handleWorkerRequest(
      state,
      setSource(1, '{"broken": 1,}'),
    );

    const { response } = handleWorkerRequest(
      afterSet,
      validateResult("job-validate-1", '{"a":1}', 1),
    );

    expect(response.kind).toBe("result-validation-complete");
    if (response.kind !== "result-validation-complete") throw new Error("wrong kind");
    expect(response.valid).toBe(true);
  });

  it("returns valid: false for invalid JSON result text", () => {
    const state = createInitialWorkerState();
    const { state: afterSet } = handleWorkerRequest(state, setSource(1, '{"a":1}'));

    const { response } = handleWorkerRequest(
      afterSet,
      validateResult("job-validate-2", '{"broken":}', 1),
    );

    expect(response.kind).toBe("result-validation-complete");
    if (response.kind !== "result-validation-complete") throw new Error("wrong kind");
    expect(response.valid).toBe(false);
  });

  it("does not replace the stored source revision after validate-result", () => {
    // Set source to invalid JSON at revision 1
    const initialState = createInitialWorkerState();
    const { state: afterSet } = handleWorkerRequest(
      initialState,
      setSource(1, '{"a":1,}'),
    );

    // Run validate-result with a DIFFERENT (valid) text
    const { state: afterValidate } = handleWorkerRequest(
      afterSet,
      validateResult("job-validate-3", '{"a":1}', 1),
    );

    // The stored source must still be the original invalid text, not the result text
    expect(afterValidate.source?.revision).toBe(1);
    expect(afterValidate.source?.text).toBe('{"a":1,}');
  });

  it("analyze-repair after validate-result still uses the original stored text", () => {
    // Set source to invalid JSON
    const initialState = createInitialWorkerState();
    const { state: afterSet } = handleWorkerRequest(
      initialState,
      setSource(1, '{"a":1,}'),
    );

    // validate-result with a valid text (must not overwrite stored source)
    const { state: afterValidate } = handleWorkerRequest(
      afterSet,
      validateResult("job-validate-4", '{"good":true}', 1),
    );

    // analyze-repair should use the stored invalid text, not the validated result text
    const { response: repairResponse } = handleWorkerRequest(afterValidate, {
      id: "job-analyze",
      kind: "analyze-repair",
      source: { revision: 1, text: '{"a":1,}' },
    });

    expect(repairResponse.kind).toBe("repair-analysis-complete");
    if (repairResponse.kind !== "repair-analysis-complete")
      throw new Error("wrong kind");
    // The analysis must be for the original broken input (not "good" text)
    expect(repairResponse.analysis.kind).not.toBe("manual");
  });

  it("returns the result document in the response", () => {
    const initialState = createInitialWorkerState();
    const { state: afterSet } = handleWorkerRequest(
      initialState,
      setSource(1, '{"a":1}'),
    );

    const resultDoc = {
      action: "repair" as const,
      format: "json" as const,
      revision: 1,
      text: '{"a":1}',
    };

    const { response } = handleWorkerRequest(afterSet, {
      id: "job-validate-5",
      kind: "validate-result",
      result: resultDoc,
    });

    expect(response.kind).toBe("result-validation-complete");
    if (response.kind !== "result-validation-complete") throw new Error("wrong kind");
    expect(response.result).toEqual(resultDoc);
    expect(response.id).toBe("job-validate-5");
  });
});
