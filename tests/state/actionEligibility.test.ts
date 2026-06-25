import { describe, expect, it } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import {
  INITIAL_WORKSPACE_STATE,
  type WorkspaceState,
} from "../../src/domain/workspace";
import { getActionEligibility, type ActionId } from "../../src/state/actionEligibility";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stateWithInput = (overrides?: Partial<WorkspaceState>): WorkspaceState => ({
  ...INITIAL_WORKSPACE_STATE,
  input: '{"a":1}',
  revision: 1,
  inputSize: 7,
  ...overrides,
});

const aDiagnostic = (): Diagnostic => ({
  code: "test-error",
  message: "Test error",
  position: { offset: 0, line: 1, column: 1 },
  reliability: "confirmed",
  repairState: "not-applicable",
  severity: "error",
});

// ---------------------------------------------------------------------------
// Beautify, Minify, Convert
// ---------------------------------------------------------------------------

const FORMAT_ACTIONS: ActionId[] = ["beautify", "minify", "convert"];

describe("getActionEligibility — beautify / minify / convert", () => {
  it.each(FORMAT_ACTIONS)("disables %s when input is empty", (action) => {
    const result = getActionEligibility(INITIAL_WORKSPACE_STATE, action);

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe("Paste JSON first.");
  });

  it.each(FORMAT_ACTIONS)("disables %s when validation has not completed", (action) => {
    const state = stateWithInput({ validationState: "validating" });
    const result = getActionEligibility(state, action);

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("Waiting for validation");
  });

  it.each(FORMAT_ACTIONS)("disables %s when input has errors", (action) => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [aDiagnostic()],
    });
    const result = getActionEligibility(state, action);

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("valid JSON");
  });

  it.each(FORMAT_ACTIONS)("enables %s for validated valid JSON", (action) => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [],
    });
    const result = getActionEligibility(state, action);

    expect(result.enabled).toBe(true);
    expect(result.reason).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Repair JSON
// ---------------------------------------------------------------------------

describe("getActionEligibility — repair-json", () => {
  it("disables when input is empty", () => {
    const result = getActionEligibility(INITIAL_WORKSPACE_STATE, "repair-json");

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe("Paste JSON first.");
  });

  it("disables when validation has not completed", () => {
    const state = stateWithInput({ validationState: "validating" });
    const result = getActionEligibility(state, "repair-json");

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("Waiting for validation");
  });

  it("disables when JSON is valid (no diagnostics)", () => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [],
    });
    const result = getActionEligibility(state, "repair-json");

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("No repair needed");
  });

  it("disables when eligibility is false (unsupported)", () => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [aDiagnostic()],
      eligibility: {
        isEligible: false,
        reason: "unsupported-diagnostic",
        diagnosticCode: "test-error",
      },
    });
    const result = getActionEligibility(state, "repair-json");

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("No safe repair can be proposed");
  });

  it("disables when eligibility is null despite diagnostics (loading)", () => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [aDiagnostic()],
      eligibility: null,
    });
    const result = getActionEligibility(state, "repair-json");

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("No safe repair can be proposed");
  });

  it("enables when diagnostics exist and eligibility is true", () => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [aDiagnostic()],
      eligibility: {
        isEligible: true,
        diagnosticCode: "missing-comma",
        ruleId: "insert-missing-comma",
      },
    });
    const result = getActionEligibility(state, "repair-json");

    expect(result.enabled).toBe(true);
    expect(result.reason).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Copy / Download
// ---------------------------------------------------------------------------

const RESULT_ACTIONS: ActionId[] = ["copy", "download"];

describe("getActionEligibility — copy / download", () => {
  it.each(RESULT_ACTIONS)("disables %s when no result exists", (action) => {
    const result = getActionEligibility(INITIAL_WORKSPACE_STATE, action);

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("Create a result first");
  });

  it.each(RESULT_ACTIONS)("enables %s when result exists", (action) => {
    const state = {
      ...INITIAL_WORKSPACE_STATE,
      result: {
        action: "beautify" as const,
        format: "json" as const,
        revision: 1,
        text: '{"a":1}',
      },
    };
    const result = getActionEligibility(state, action);

    expect(result.enabled).toBe(true);
    expect(result.reason).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Schema Check
// ---------------------------------------------------------------------------

describe("getActionEligibility — schema-check", () => {
  it("disables when input is empty", () => {
    const result = getActionEligibility(INITIAL_WORKSPACE_STATE, "schema-check");

    expect(result.enabled).toBe(false);
    expect(result.reason).toBe("Paste JSON first.");
  });

  it("disables when validation has not completed", () => {
    const state = stateWithInput({ validationState: "idle" });
    const result = getActionEligibility(state, "schema-check");

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("Waiting for validation");
  });

  it("disables when input has errors", () => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [aDiagnostic()],
    });
    const result = getActionEligibility(state, "schema-check");

    expect(result.enabled).toBe(false);
    expect(result.reason).toContain("valid JSON");
  });

  it("enables for validated valid JSON", () => {
    const state = stateWithInput({
      validationState: "validated",
      diagnostics: [],
    });
    const result = getActionEligibility(state, "schema-check");

    expect(result.enabled).toBe(true);
    expect(result.reason).toBe("");
  });
});
