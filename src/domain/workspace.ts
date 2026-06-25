import type { Diagnostic } from "./diagnostics";
import type { RepairAnalysisResult, RepairEligibility } from "./repair";
import type { ResultDocument } from "./result";

export type ValidationState = "idle" | "validating" | "validated";
export type RepairState = "idle" | "analyzing" | "ready" | "accepted";
export type MobilePanel = "input" | "result" | "schema";

export interface WorkspaceState {
  readonly input: string;
  readonly revision: number;
  readonly inputSize: number | null;
  readonly sizeError: string | null;
  readonly isExample: boolean;

  readonly validationState: ValidationState;
  readonly diagnostics: readonly Diagnostic[];
  readonly eligibility: RepairEligibility | null;

  readonly result: ResultDocument | null;
  readonly resultError: string | null;

  readonly repairState: RepairState;
  readonly repairAnalysis: RepairAnalysisResult | null;

  readonly schemaText: string;
  readonly schemaDiagnostics: readonly Diagnostic[];

  readonly mobilePanel: MobilePanel;
}

export type WorkspaceAction =
  | { readonly type: "SET_INPUT"; readonly text: string; readonly isUpload: boolean }
  | { readonly type: "CLEAR_INPUT" }
  | { readonly type: "SET_VALIDATING" }
  | {
      readonly type: "SET_VALIDATION";
      readonly diagnostics: readonly Diagnostic[];
      readonly eligibility: RepairEligibility;
      readonly revision: number;
    }
  | { readonly type: "SET_RESULT"; readonly result: ResultDocument }
  | { readonly type: "SET_RESULT_TEXT"; readonly text: string }
  | { readonly type: "CLEAR_RESULT" }
  | {
      readonly type: "SET_REPAIR_ANALYSIS";
      readonly analysis: RepairAnalysisResult;
      readonly revision: number;
    }
  | { readonly type: "CLEAR_REPAIR" }
  | { readonly type: "SET_SCHEMA_TEXT"; readonly text: string }
  | {
      readonly type: "SET_SCHEMA_DIAGNOSTICS";
      readonly diagnostics: readonly Diagnostic[];
    }
  | { readonly type: "SET_MOBILE_PANEL"; readonly panel: MobilePanel }
  | { readonly type: "SET_LOADED_STATE"; readonly state: WorkspaceState }
  | { readonly type: "SET_EXAMPLE" }
  | { readonly type: "CLEAR_WORKSPACE" };

export const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10 MB

export const SIZE_ERROR_MESSAGE = "File exceeds 10 MB limit.";

export const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  input: "",
  revision: 0,
  inputSize: null,
  sizeError: null,
  isExample: false,

  validationState: "idle",
  diagnostics: [],
  eligibility: null,

  result: null,
  resultError: null,

  repairState: "idle",
  repairAnalysis: null,

  schemaText: "",
  schemaDiagnostics: [],

  mobilePanel: "input",
};
