import type { RepairCandidate, SyntaxEdit } from "../../domain/repair";
import { applySyntaxEdits } from "./applyCandidate";
import { createSyntaxRepairCandidates } from "./rules";
import type { RepairDataToken, RepairToken } from "./tokenizer";
import { tokenizeRepairInput } from "./tokenizer";
import { verifyRepairCandidate } from "./verifyCandidate";

interface CandidateDraft {
  readonly edits: readonly SyntaxEdit[];
  readonly id: string;
  readonly summary: string;
}

export const generateVerifiedRepairCandidates = (
  input: string,
): readonly RepairCandidate[] => {
  const tokens = tokenizeRepairInput(input);
  const drafts: readonly CandidateDraft[] = [
    ...createSyntaxRepairCandidates(input, tokens).map((candidate) => ({
      edits: candidate.edits,
      id: candidate.ruleId,
      summary: candidate.summary,
    })),
    ...createAmbiguousAdjacentValueDrafts(input, tokens),
  ];
  const candidates: RepairCandidate[] = [];
  const seenRepairedText = new Set<string>();

  for (const draft of drafts) {
    const repairedText = applySyntaxEdits(input, draft.edits);

    if (seenRepairedText.has(repairedText)) {
      continue;
    }

    const verification = verifyRepairCandidate(input, repairedText, draft.edits);

    if (verification.result !== "verified") {
      continue;
    }

    seenRepairedText.add(repairedText);
    candidates.push({
      edits: draft.edits,
      id: draft.id,
      repairedText,
      summary: draft.summary,
      verification,
    });
  }

  return candidates;
};

const createAmbiguousAdjacentValueDrafts = (
  input: string,
  tokens: readonly RepairToken[],
): readonly CandidateDraft[] => {
  const dataTokens = tokens.filter(isDataToken);

  for (let index = 0; index < dataTokens.length - 1; index += 1) {
    const current = dataTokens[index];
    const next = dataTokens[index + 1];

    if (
      current === undefined ||
      next === undefined ||
      !hasPreviousColon(input, current)
    ) {
      continue;
    }

    const currentStart = getCompleteDataStartOffset(input, current);
    const currentEnd = getCompleteDataEndOffset(input, current);
    const nextEnd = getCompleteDataEndOffset(input, next);
    const nextStart = getCompleteDataStartOffset(input, next);
    const finalObjectEnd = findFinalObjectEnd(input);

    if (
      currentStart === null ||
      currentEnd === null ||
      nextStart === null ||
      nextEnd === null ||
      finalObjectEnd === null ||
      !isOnlyWhitespace(input, currentEnd, nextStart)
    ) {
      continue;
    }

    return [
      {
        edits: [
          insertEdit(currentStart, "["),
          insertEdit(currentEnd, ","),
          insertEdit(nextEnd, "]"),
        ],
        id: "adjacent-values-as-property-array",
        summary: "Treat adjacent values as an array value for the existing key.",
      },
      {
        edits: [
          insertEdit(0, "["),
          insertEdit(currentEnd, "},"),
          replaceEdit(finalObjectEnd, finalObjectEnd + 1, "]"),
        ],
        id: "adjacent-values-as-top-level-array",
        summary: "Treat the object and adjacent value as separate array items.",
      },
    ];
  }

  return [];
};

const isDataToken = (token: RepairToken): token is RepairDataToken =>
  token.kind !== "syntax";

const insertEdit = (offset: number, replacement: string): SyntaxEdit => ({
  endOffset: offset,
  replacement,
  startOffset: offset,
  type: "insert",
});

const replaceEdit = (
  startOffset: number,
  endOffset: number,
  replacement: string,
): SyntaxEdit => ({
  endOffset,
  replacement,
  startOffset,
  type: "replace",
});

const getCompleteDataStartOffset = (
  input: string,
  token: RepairDataToken,
): number | null => {
  if (token.kind !== "string") {
    return token.startOffset;
  }

  const openingOffset = token.startOffset - 1;
  const openingDelimiter = input[openingOffset];

  return openingDelimiter === "'" || openingDelimiter === '"' ? openingOffset : null;
};

const getCompleteDataEndOffset = (
  input: string,
  token: RepairDataToken,
): number | null => {
  if (token.kind !== "string") {
    return token.endOffset;
  }

  const closingDelimiter = input[token.endOffset];

  return closingDelimiter === "'" || closingDelimiter === '"'
    ? token.endOffset + 1
    : null;
};

const hasPreviousColon = (input: string, token: RepairDataToken): boolean => {
  const startOffset = getCompleteDataStartOffset(input, token) ?? token.startOffset;
  const previousOffset = findPreviousMeaningfulOffset(input, startOffset - 1);

  return previousOffset !== null && input[previousOffset] === ":";
};

const isOnlyWhitespace = (
  input: string,
  startOffset: number,
  endOffset: number,
): boolean => input.slice(startOffset, endOffset).trim().length === 0;

const findPreviousMeaningfulOffset = (
  input: string,
  startOffset: number,
): number | null => {
  for (let offset = startOffset; offset >= 0; offset -= 1) {
    if (input[offset]?.trim() !== "") {
      return offset;
    }
  }

  return null;
};

const findFinalObjectEnd = (input: string): number | null => {
  const offset = findPreviousMeaningfulOffset(input, input.length - 1);

  if (offset === null || input[offset] !== "}") {
    return null;
  }

  return offset;
};
