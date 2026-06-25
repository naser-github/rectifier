import type { WorkspaceState } from "../domain/workspace";

export type ActionId =
  | "beautify"
  | "minify"
  | "convert"
  | "repair-json"
  | "copy"
  | "download"
  | "schema-check";

export interface ActionEligibility {
  readonly enabled: boolean;
  readonly reason: string;
}

/**
 * Returns whether an action is enabled and, when disabled, why.
 *
 * The reason is a short human-readable string like
 * "Paste JSON first." or "Requires valid JSON. Fix the syntax error first."
 * that a DisabledReason tooltip can surface.
 */
export function getActionEligibility(
  state: WorkspaceState,
  action: ActionId,
): ActionEligibility {
  switch (action) {
    case "beautify":
    case "minify":
    case "convert":
      return getFormatConversionEligibility(state);

    case "repair-json":
      return getRepairJsonEligibility(state);

    case "copy":
    case "download":
      return getResultActionEligibility(state);

    case "schema-check":
      return getSchemaCheckEligibility(state);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFormatConversionEligibility(state: WorkspaceState): ActionEligibility {
  if (!state.input) {
    return { enabled: false, reason: "Paste JSON first." };
  }

  if (state.validationState !== "validated") {
    return { enabled: false, reason: "Waiting for validation…" };
  }

  if (state.diagnostics.length > 0) {
    return {
      enabled: false,
      reason: "Requires valid JSON. Fix the syntax error first.",
    };
  }

  return { enabled: true, reason: "" };
}

function getRepairJsonEligibility(state: WorkspaceState): ActionEligibility {
  if (!state.input) {
    return {
      enabled: false,
      reason: "Paste JSON first.",
    };
  }

  if (state.validationState !== "validated") {
    return {
      enabled: false,
      reason: "Waiting for validation…",
    };
  }

  if (state.diagnostics.length === 0) {
    return {
      enabled: false,
      reason: "JSON is valid. No repair needed.",
    };
  }

  if (!state.eligibility?.isEligible) {
    return {
      enabled: false,
      reason: "No safe repair can be proposed. Edit the JSON manually.",
    };
  }

  return { enabled: true, reason: "" };
}

function getResultActionEligibility(state: WorkspaceState): ActionEligibility {
  if (!state.result) {
    return {
      enabled: false,
      reason: "Create a result first using Beautify, Minify, Convert, or Repair JSON.",
    };
  }

  return { enabled: true, reason: "" };
}

function getSchemaCheckEligibility(state: WorkspaceState): ActionEligibility {
  if (!state.input) {
    return { enabled: false, reason: "Paste JSON first." };
  }

  if (state.validationState !== "validated") {
    return {
      enabled: false,
      reason: "Waiting for validation…",
    };
  }

  if (state.diagnostics.length > 0) {
    return {
      enabled: false,
      reason: "Requires valid JSON. Fix the syntax error first.",
    };
  }

  return { enabled: true, reason: "" };
}
