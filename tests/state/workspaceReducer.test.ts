import { describe, expect, it } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import type { RepairAnalysisResult } from "../../src/domain/repair";
import type { ResultDocument } from "../../src/domain/result";
import {
  INITIAL_WORKSPACE_STATE,
  MAX_INPUT_SIZE,
  SIZE_ERROR_MESSAGE,
  type WorkspaceAction,
  type WorkspaceState,
} from "../../src/domain/workspace";
import { workspaceReducer } from "../../src/state/workspaceReducer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const aDiagnostic = (overrides?: Partial<Diagnostic>): Diagnostic => ({
  code: "test-error",
  message: "Test error",
  position: { offset: 0, line: 1, column: 1 },
  reliability: "confirmed",
  repairState: "not-applicable",
  severity: "error",
  ...overrides,
});

const aResult = (overrides?: Partial<ResultDocument>): ResultDocument => ({
  action: "beautify",
  format: "json",
  revision: 1,
  text: '{"a":1}',
  ...overrides,
});

const aRepairAnalysis = (): RepairAnalysisResult => ({
  kind: "safe",
  candidate: {
    id: "candidate-1",
    summary: "Inserted comma",
    edits: [
      {
        startOffset: 5,
        endOffset: 5,
        replacement: ",",
        type: "insert",
      },
    ],
    repairedText: '{"a":1,"b":2}',
    verification: {
      result: "verified",
      dataPreserved: true,
      exactSourcePreserved: true,
    },
  },
});

// ---------------------------------------------------------------------------
// SET_INPUT
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_INPUT", () => {
  it("sets input text and bumps revision", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: '{"a":1}',
      isUpload: false,
    });

    expect(state.input).toBe('{"a":1}');
    expect(state.revision).toBe(1);
  });

  it("sets inputSize to the text length", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: '{"a":1}',
      isUpload: false,
    });

    expect(state.inputSize).toBe(7);
  });

  it("clears sizeError when input is within limit", () => {
    const stateWithError: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      sizeError: SIZE_ERROR_MESSAGE,
    };

    const state = workspaceReducer(stateWithError, {
      type: "SET_INPUT",
      text: "small",
      isUpload: false,
    });

    expect(state.sizeError).toBeNull();
  });

  it("sets sizeError when input exceeds 10 MB", () => {
    const oversized = "x".repeat(MAX_INPUT_SIZE + 1);

    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: oversized,
      isUpload: false,
    });

    expect(state.sizeError).toBe(SIZE_ERROR_MESSAGE);
  });

  it("clears diagnostics, eligibility, and validation state", () => {
    const dirty: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"old":true}',
      revision: 5,
      validationState: "validated",
      diagnostics: [aDiagnostic()],
      eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
    };

    const state = workspaceReducer(dirty, {
      type: "SET_INPUT",
      text: '{"new":true}',
      isUpload: false,
    });

    expect(state.input).toBe('{"new":true}');
    expect(state.revision).toBe(6);
    expect(state.validationState).toBe("idle");
    expect(state.diagnostics).toHaveLength(0);
    expect(state.eligibility).toBeNull();
  });

  it("clears result and resultError when input changes", () => {
    const dirty: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      result: aResult(),
      resultError: "Something went wrong",
    };

    const state = workspaceReducer(dirty, {
      type: "SET_INPUT",
      text: '{"new":true}',
      isUpload: false,
    });

    expect(state.result).toBeNull();
    expect(state.resultError).toBeNull();
  });

  it("clears repair state", () => {
    const dirty: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      repairState: "ready",
      repairAnalysis: {
        kind: "manual",
        guidance: "Edit manually.",
        reason: "unsupported-syntax",
      },
    };

    const state = workspaceReducer(dirty, {
      type: "SET_INPUT",
      text: '{"new":true}',
      isUpload: false,
    });

    expect(state.repairState).toBe("idle");
    expect(state.repairAnalysis).toBeNull();
  });

  it("preserves mobile panel", () => {
    const dirty: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      mobilePanel: "schema",
    };

    const state = workspaceReducer(dirty, {
      type: "SET_INPUT",
      text: '{"a":1}',
      isUpload: false,
    });

    expect(state.mobilePanel).toBe("schema");
  });

  it("preserves schema text and diagnostics", () => {
    const dirty: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      schemaText: '{"type":"object"}',
      schemaDiagnostics: [aDiagnostic({ code: "schema-error" })],
    };

    const state = workspaceReducer(dirty, {
      type: "SET_INPUT",
      text: '{"a":1}',
      isUpload: false,
    });

    expect(state.schemaText).toBe('{"type":"object"}');
    expect(state.schemaDiagnostics).toHaveLength(1);
    expect(state.schemaDiagnostics[0]?.code).toBe("schema-error");
  });

  it("increments revision monotonically on repeated SET_INPUT", () => {
    const state = [1, 2, 3].reduce<WorkspaceState>(
      (s) => workspaceReducer(s, { type: "SET_INPUT", text: "x", isUpload: false }),
      INITIAL_WORKSPACE_STATE,
    );

    expect(state.revision).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// SET_VALIDATING
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_VALIDATING", () => {
  it("sets validationState to validating", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, { type: "SET_VALIDATING" });

    expect(state.validationState).toBe("validating");
  });
});

// ---------------------------------------------------------------------------
// SET_VALIDATION
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_VALIDATION", () => {
  it("sets diagnostics, eligibility, and validationState to validated", () => {
    const stateWithInput = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: '{"broken"',
      isUpload: true,
    });

    const diagnostic = aDiagnostic();
    const eligibility = {
      isEligible: false as const,
      reason: "unsupported-diagnostic" as const,
      diagnosticCode: "test-error",
    };

    const state = workspaceReducer(stateWithInput, {
      type: "SET_VALIDATION",
      diagnostics: [diagnostic],
      eligibility,
      revision: stateWithInput.revision,
    });

    expect(state.validationState).toBe("validated");
    expect(state.diagnostics).toEqual([diagnostic]);
    expect(state.eligibility).toEqual(eligibility);
  });

  it("ignores stale response when revision is lower than current", () => {
    const stateWithInput = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: '{"broken"',
      isUpload: true,
    });
    // State now has revision = 1

    const currentDiagnostic = aDiagnostic({ code: "json.current" });
    const staleDiagnostic = aDiagnostic({ code: "json.stale" });

    // Apply current-revision response
    const afterCurrent = workspaceReducer(stateWithInput, {
      type: "SET_VALIDATION",
      diagnostics: [currentDiagnostic],
      eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      revision: stateWithInput.revision, // 1
    });

    // Apply stale-revision response (revision = 0)
    const state = workspaceReducer(afterCurrent, {
      type: "SET_VALIDATION",
      diagnostics: [staleDiagnostic],
      eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      revision: 0,
    });

    // Must still have the current diagnostic
    expect(state.diagnostics).toEqual([currentDiagnostic]);
    expect(state.eligibility).toEqual({
      isEligible: false,
      reason: "valid-json",
      diagnosticCode: "",
    });
  });

  it("ignores stale response when revision does not match current state revision", () => {
    // State at revision 2, response arrives for revision 5 (from future) or
    // revision 1 (from past) — either way, revision mismatch means stale.
    const stateAtRevision2: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      revision: 2,
    };

    const state = workspaceReducer(stateAtRevision2, {
      type: "SET_VALIDATION",
      diagnostics: [aDiagnostic({ code: "stale" })],
      eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      revision: 5, // does not match state.revision (2)
    });

    expect(state.validationState).toBe("idle");
    expect(state.diagnostics).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SET_RESULT / CLEAR_RESULT
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_RESULT / CLEAR_RESULT", () => {
  it("sets the result document", () => {
    const result = aResult();

    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_RESULT",
      result,
    });

    expect(state.result).toEqual(result);
  });

  it("CLEAR_RESULT removes the result", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, result: aResult() },
      { type: "CLEAR_RESULT" },
    );

    expect(state.result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SET_REPAIR_ANALYSIS / CLEAR_REPAIR
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_REPAIR_ANALYSIS / CLEAR_REPAIR", () => {
  it("sets repair analysis and repairState to ready", () => {
    const stateWithInput = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: '{"broken"',
      isUpload: true,
    });

    const analysis = aRepairAnalysis();

    const state = workspaceReducer(stateWithInput, {
      type: "SET_REPAIR_ANALYSIS",
      analysis,
      revision: stateWithInput.revision,
    });

    expect(state.repairState).toBe("ready");
    expect(state.repairAnalysis).toEqual(analysis);
  });

  it("ignores stale repair analysis when revision is lower", () => {
    const stateWithInput = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_INPUT",
      text: '{"broken"',
      isUpload: true,
    });

    const freshAnalysis = aRepairAnalysis();

    // Apply fresh analysis
    const afterFresh = workspaceReducer(stateWithInput, {
      type: "SET_REPAIR_ANALYSIS",
      analysis: freshAnalysis,
      revision: stateWithInput.revision,
    });

    // Stale analysis arrives
    const staleAnalysis: RepairAnalysisResult = {
      kind: "manual",
      guidance: "Stale guidance",
      reason: "unsupported-syntax",
    };

    const state = workspaceReducer(afterFresh, {
      type: "SET_REPAIR_ANALYSIS",
      analysis: staleAnalysis,
      revision: stateWithInput.revision - 1,
    });

    expect(state.repairAnalysis).toEqual(freshAnalysis);
  });

  it("CLEAR_REPAIR resets repair state", () => {
    const analysis = aRepairAnalysis();

    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, repairState: "ready", repairAnalysis: analysis },
      { type: "CLEAR_REPAIR" },
    );

    expect(state.repairState).toBe("idle");
    expect(state.repairAnalysis).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SET_RESULT_ERROR
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_RESULT_ERROR", () => {
  it("sets the result error message", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_RESULT_ERROR",
      error: "Something went wrong.",
    });

    expect(state.resultError).toBe("Something went wrong.");
  });

  it("CLEAR_RESULT clears the error", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, resultError: "Old error" },
      { type: "CLEAR_RESULT" },
    );

    expect(state.resultError).toBeNull();
  });

  it("SET_INPUT clears the error", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, resultError: "Stale error" },
      { type: "SET_INPUT", text: '{"a":1}', isUpload: true },
    );

    expect(state.resultError).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SET_SCHEMA_TEXT / SET_SCHEMA_DIAGNOSTICS
// ---------------------------------------------------------------------------

describe("workspaceReducer — schema actions", () => {
  it("SET_SCHEMA_TEXT updates schema text", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_SCHEMA_TEXT",
      text: '{"type":"object"}',
    });

    expect(state.schemaText).toBe('{"type":"object"}');
  });

  it("SET_SCHEMA_DIAGNOSTICS updates schema diagnostics", () => {
    const diagnostic = aDiagnostic({ code: "schema-error" });

    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_SCHEMA_DIAGNOSTICS",
      diagnostics: [diagnostic],
    });

    expect(state.schemaDiagnostics).toEqual([diagnostic]);
  });

  it("SET_SCHEMA_DIAGNOSTICS preserves current input and result", () => {
    const result = aResult({ text: '{"formatted":true}' });
    const state = workspaceReducer(
      {
        ...INITIAL_WORKSPACE_STATE,
        input: '{"name":"John"}',
        revision: 3,
        result,
      },
      {
        type: "SET_SCHEMA_DIAGNOSTICS",
        diagnostics: [aDiagnostic({ code: "schema.type" })],
      },
    );

    expect(state.input).toBe('{"name":"John"}');
    expect(state.revision).toBe(3);
    expect(state.result).toBe(result);
  });
});

// ---------------------------------------------------------------------------
// SET_MOBILE_PANEL
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_MOBILE_PANEL", () => {
  it("changes the active mobile panel", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_MOBILE_PANEL",
      panel: "result",
    });

    expect(state.mobilePanel).toBe("result");
  });
});

// ---------------------------------------------------------------------------
// CLEAR_WORKSPACE
// ---------------------------------------------------------------------------

describe("workspaceReducer — CLEAR_WORKSPACE", () => {
  it("resets to initial workspace state", () => {
    const dirty: WorkspaceState = {
      input: '{"data":"test"}',
      revision: 7,
      inputSize: 15,
      sizeError: null,
      isExample: false,
      validationState: "validated",
      diagnostics: [aDiagnostic()],
      eligibility: {
        isEligible: true,
        diagnosticCode: "missing-comma",
        ruleId: "insert-comma",
      },
      result: aResult(),
      resultError: null,
      repairState: "ready",
      repairAnalysis: aRepairAnalysis(),
      repairValidation: null,
      schemaText: '{"type":"object"}',
      schemaDiagnostics: [aDiagnostic({ code: "schema-error" })],
      mobilePanel: "schema",
    };

    const state = workspaceReducer(dirty, { type: "CLEAR_WORKSPACE" });

    expect(state).toEqual(INITIAL_WORKSPACE_STATE);
  });
});

// ---------------------------------------------------------------------------
// CLEAR_INPUT
// ---------------------------------------------------------------------------

describe("workspaceReducer — CLEAR_INPUT", () => {
  it("clears input, validation, result, and repair but keeps schema and panel", () => {
    const dirty: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"data":"test"}',
      revision: 5,
      inputSize: 15,
      validationState: "validated",
      diagnostics: [aDiagnostic()],
      eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      result: aResult(),
      repairState: "ready",
      schemaText: '{"type":"object"}',
      schemaDiagnostics: [aDiagnostic({ code: "schema-error" })],
      mobilePanel: "schema",
    };

    const state = workspaceReducer(dirty, { type: "CLEAR_INPUT" });

    expect(state.input).toBe("");
    expect(state.revision).toBe(0);
    expect(state.inputSize).toBeNull();
    expect(state.isExample).toBe(false);
    expect(state.validationState).toBe("idle");
    expect(state.diagnostics).toHaveLength(0);
    expect(state.eligibility).toBeNull();
    expect(state.result).toBeNull();
    expect(state.repairState).toBe("idle");
    expect(state.repairAnalysis).toBeNull();
    // Schema and panel preserved
    expect(state.schemaText).toBe('{"type":"object"}');
    expect(state.schemaDiagnostics).toHaveLength(1);
    expect(state.mobilePanel).toBe("schema");
  });
});

// ---------------------------------------------------------------------------
// SET_RESULT_TEXT
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_RESULT_TEXT", () => {
  it("updates the result text while preserving other result fields", () => {
    const result = aResult({
      text: '{"a":1}',
      format: "json",
      action: "beautify",
      revision: 2,
    });

    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, result },
      { type: "SET_RESULT_TEXT", text: '{"b":2}' },
    );

    expect(state.result?.text).toBe('{"b":2}');
    expect(state.result?.format).toBe("json");
    expect(state.result?.action).toBe("beautify");
    expect(state.result?.revision).toBe(2);
  });

  it("does nothing when no result exists", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_RESULT_TEXT",
      text: '{"a":1}',
    });

    expect(state.result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SET_LOADED_STATE
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_LOADED_STATE", () => {
  it("replaces the entire state with the loaded state", () => {
    const loaded: WorkspaceState = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"restored":true}',
      revision: 3,
      inputSize: 16,
    };

    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_LOADED_STATE",
      state: loaded,
    });

    expect(state.input).toBe('{"restored":true}');
    expect(state.revision).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// SET_EXAMPLE
// ---------------------------------------------------------------------------

describe("workspaceReducer — SET_EXAMPLE", () => {
  it("sets isExample to true", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, { type: "SET_EXAMPLE" });

    expect(state.isExample).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isExample clearing
// ---------------------------------------------------------------------------

describe("workspaceReducer — isExample clearing", () => {
  it("clears isExample on SET_INPUT", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, isExample: true },
      { type: "SET_INPUT", text: '{"a":1}', isUpload: false },
    );

    expect(state.isExample).toBe(false);
  });

  it("clears isExample on CLEAR_INPUT", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, isExample: true },
      { type: "CLEAR_INPUT" },
    );

    expect(state.isExample).toBe(false);
  });

  it("clears isExample on CLEAR_WORKSPACE", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, isExample: true },
      { type: "CLEAR_WORKSPACE" },
    );

    expect(state.isExample).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unknown action (exhaustive switch safety)
// ---------------------------------------------------------------------------

describe("workspaceReducer — unknown action", () => {
  it("returns state unchanged for unrecognised action type", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "UNKNOWN_ACTION",
    } as unknown as WorkspaceAction);

    expect(state).toBe(INITIAL_WORKSPACE_STATE);
  });
});
