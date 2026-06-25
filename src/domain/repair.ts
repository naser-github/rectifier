export type RepairEligibility =
  | {
      readonly diagnosticCode: string;
      readonly isEligible: true;
      readonly ruleId: string;
    }
  | {
      readonly diagnosticCode: string;
      readonly isEligible: false;
      readonly reason: "unsupported-diagnostic" | "ambiguous-syntax" | "valid-json";
    };

export type SyntaxEditType = "insert" | "remove" | "replace";

export interface SyntaxEdit {
  readonly endOffset: number;
  readonly replacement: string;
  readonly startOffset: number;
  readonly type: SyntaxEditType;
}

export type RepairVerificationResult =
  | {
      readonly dataPreserved: true;
      readonly exactSourcePreserved: true;
      readonly result: "verified";
    }
  | {
      readonly dataPreserved: false;
      readonly exactSourcePreserved: boolean;
      readonly reason: string;
      readonly result: "rejected";
    };

export interface RepairCandidate {
  readonly edits: readonly SyntaxEdit[];
  readonly id: string;
  readonly repairedText: string;
  readonly summary: string;
  readonly verification: RepairVerificationResult;
}

export type RepairAnalysisResult =
  | {
      readonly candidate: RepairCandidate;
      readonly kind: "safe";
    }
  | {
      readonly choices: readonly RepairCandidate[];
      readonly kind: "ambiguous";
      readonly manualGuidance: string;
    }
  | {
      readonly guidance: string;
      readonly kind: "manual";
      readonly reason:
        | "unsupported-syntax"
        | "unsafe-change"
        | "unverified"
        | "valid-json";
    };
