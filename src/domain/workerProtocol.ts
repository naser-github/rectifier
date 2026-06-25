import type { Diagnostic } from "./diagnostics";
import type { RepairAnalysisResult, RepairEligibility } from "./repair";
import type { ResultDocument, ResultFormat } from "./result";

export interface WorkerSourceRevision {
  readonly revision: number;
  readonly text: string;
}

export type FormatOperation = "beautify" | "minify";

export type ConversionFormat = Extract<ResultFormat, "yaml" | "xml" | "csv">;

export type WorkerRequest =
  | {
      readonly id: string;
      readonly kind: "set-source";
      readonly source: WorkerSourceRevision;
    }
  | {
      readonly id: string;
      readonly kind: "format";
      readonly operation: FormatOperation;
      readonly source: WorkerSourceRevision;
    }
  | {
      readonly id: string;
      readonly kind: "analyze-repair";
      readonly source: WorkerSourceRevision;
    }
  | {
      readonly id: string;
      readonly kind: "convert";
      readonly format: ConversionFormat;
      readonly source: WorkerSourceRevision;
    }
  | {
      readonly id: string;
      readonly kind: "validate-schema";
      readonly schemaText: string;
      readonly source: WorkerSourceRevision;
    }
  | {
      readonly id: string;
      readonly kind: "validate-result";
      readonly result: ResultDocument;
    };

export type WorkerResponse =
  | {
      readonly diagnostics: readonly Diagnostic[];
      readonly eligibility: RepairEligibility;
      readonly id: string;
      readonly kind: "source-validated";
      readonly revision: number;
    }
  | {
      readonly id: string;
      readonly kind: "format-complete";
      readonly result: ResultDocument;
      readonly revision: number;
    }
  | {
      readonly analysis: RepairAnalysisResult;
      readonly id: string;
      readonly kind: "repair-analysis-complete";
      readonly revision: number;
    }
  | {
      readonly id: string;
      readonly kind: "conversion-complete";
      readonly result: ResultDocument;
      readonly revision: number;
    }
  | {
      readonly diagnostics: readonly Diagnostic[];
      readonly id: string;
      readonly kind: "schema-validation-complete";
      readonly revision: number;
    }
  | {
      readonly id: string;
      readonly kind: "result-validation-complete";
      readonly result: ResultDocument;
      readonly valid: boolean;
    }
  | {
      readonly id: string;
      readonly kind: "failed";
      readonly message: string;
      readonly revision?: number;
    };
