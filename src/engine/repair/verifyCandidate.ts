import type { RepairVerificationResult, SyntaxEdit } from "../../domain/repair";
import { createDataFingerprint, fingerprintsEqual } from "./fingerprint";
import type { RepairDataToken } from "./tokenizer";
import { tokenizeRepairInput } from "./tokenizer";

export const verifyRepairCandidate = (
  originalText: string,
  repairedText: string,
  edits: readonly SyntaxEdit[],
): RepairVerificationResult => {
  if (edits.some((edit) => overlapsProtectedData(originalText, edit))) {
    return rejected("syntax-edit-overlaps-protected-data", true);
  }

  if (!isStrictJson(repairedText)) {
    return rejected("candidate-is-not-strict-json", true);
  }

  if (edits.length === 0) {
    const originalFingerprint = createDataFingerprint(originalText);
    const repairedFingerprint = createDataFingerprint(repairedText);

    if (!fingerprintsEqual(originalFingerprint, repairedFingerprint)) {
      return rejected("data-fingerprint-changed", false);
    }
  }

  return {
    dataPreserved: true,
    exactSourcePreserved: true,
    result: "verified",
  };
};

const overlapsProtectedData = (input: string, edit: SyntaxEdit): boolean => {
  const dataTokens = tokenizeRepairInput(input).filter(
    (token): token is RepairDataToken => token.kind !== "syntax",
  );

  return dataTokens.some(
    (token) => edit.startOffset < token.endOffset && edit.endOffset > token.startOffset,
  );
};

const rejected = (
  reason: string,
  exactSourcePreserved: boolean,
): RepairVerificationResult => ({
  dataPreserved: false,
  exactSourcePreserved,
  reason,
  result: "rejected",
});

const isStrictJson = (input: string): boolean => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};
