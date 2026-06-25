export type DiagnosticSeverity = "error" | "warning";

export type DiagnosticReliability = "confirmed" | "uncertain-follow-on";

export type DiagnosticRepairState = "not-applicable" | "eligible" | "manual";

export interface SourcePosition {
  readonly column: number;
  readonly line: number;
  readonly offset: number;
}

export interface Diagnostic {
  readonly code: string;
  readonly message: string;
  readonly position: SourcePosition;
  readonly reliability: DiagnosticReliability;
  readonly repairState: DiagnosticRepairState;
  readonly severity: DiagnosticSeverity;
}
