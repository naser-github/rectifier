import type { SyntaxEdit } from "../../domain/repair";
import type { RepairDataToken, RepairToken } from "./tokenizer";
import { tokenizeRepairInput } from "./tokenizer";

export type SyntaxRepairRuleId =
  | "missing-closing-delimiter"
  | "missing-colon"
  | "missing-comma"
  | "single-quote-delimiters"
  | "trailing-comma";

export interface SyntaxRepairCandidate {
  readonly edits: readonly SyntaxEdit[];
  readonly ruleId: SyntaxRepairRuleId;
  readonly summary: string;
}

const RULE_SUMMARIES = {
  "missing-closing-delimiter": "Insert the missing closing JSON delimiter.",
  "missing-colon": "Insert the missing colon between an object key and value.",
  "missing-comma": "Insert the missing comma between complete JSON values.",
  "single-quote-delimiters":
    "Replace single-quote string delimiters with JSON double quotes.",
  "trailing-comma": "Remove the trailing comma before a closing delimiter.",
} satisfies Record<SyntaxRepairRuleId, string>;

export const createSyntaxRepairCandidates = (
  input: string,
): readonly SyntaxRepairCandidate[] => [
  ...findMissingCommaCandidates(input),
  ...findTrailingCommaCandidates(input),
  ...findMissingColonCandidates(input),
  ...findMissingClosingDelimiterCandidates(input),
  ...findSingleQuoteDelimiterCandidates(input),
];

const findMissingCommaCandidates = (
  input: string,
): readonly SyntaxRepairCandidate[] => {
  const tokens = tokenizeRepairInput(input);
  const dataTokens = tokens.filter(isDataToken);
  const candidates: SyntaxRepairCandidate[] = [];

  for (let index = 0; index < dataTokens.length - 1; index += 1) {
    const current = dataTokens[index];
    const next = dataTokens[index + 1];

    if (current === undefined || next === undefined) {
      continue;
    }

    const currentEnd = getCompleteDataEndOffset(tokens, current);
    const nextStart = getCompleteDataStartOffset(tokens, next);

    if (
      currentEnd === null ||
      nextStart === null ||
      !isOnlyWhitespace(input, currentEnd, nextStart) ||
      !hasPreviousColon(input, tokens, current)
    ) {
      continue;
    }

    candidates.push(createCandidate("missing-comma", [insertEdit(currentEnd, ",")]));
  }

  return candidates;
};

const findTrailingCommaCandidates = (
  input: string,
): readonly SyntaxRepairCandidate[] => {
  const candidates: SyntaxRepairCandidate[] = [];

  for (let offset = 0; offset < input.length; offset += 1) {
    if (input[offset] !== ",") {
      continue;
    }

    const nextMeaningful = findNextMeaningfulOffset(input, offset + 1);

    if (
      nextMeaningful !== null &&
      (input[nextMeaningful] === "}" || input[nextMeaningful] === "]")
    ) {
      candidates.push(
        createCandidate("trailing-comma", [removeEdit(offset, offset + 1)]),
      );
    }
  }

  return candidates;
};

const findMissingColonCandidates = (
  input: string,
): readonly SyntaxRepairCandidate[] => {
  const tokens = tokenizeRepairInput(input);
  const dataTokens = tokens.filter(isDataToken);
  const candidates: SyntaxRepairCandidate[] = [];

  for (let index = 0; index < dataTokens.length - 1; index += 1) {
    const current = dataTokens[index];
    const next = dataTokens[index + 1];

    if (
      current === undefined ||
      next === undefined ||
      current.kind !== "string" ||
      !isObjectKeyContext(input, tokens, current)
    ) {
      continue;
    }

    const currentEnd = getCompleteDataEndOffset(tokens, current);
    const nextStart = getCompleteDataStartOffset(tokens, next);

    if (
      currentEnd === null ||
      nextStart === null ||
      !isOnlyWhitespace(input, currentEnd, nextStart)
    ) {
      continue;
    }

    candidates.push(createCandidate("missing-colon", [insertEdit(currentEnd, ":")]));
  }

  return candidates;
};

const findMissingClosingDelimiterCandidates = (
  input: string,
): readonly SyntaxRepairCandidate[] => {
  const closers = getMissingClosingDelimiters(input);

  if (closers.length === 0 || endsWithIncompleteSyntax(input)) {
    return [];
  }

  return [
    createCandidate("missing-closing-delimiter", [
      insertEdit(input.length, closers.join("")),
    ]),
  ];
};

const findSingleQuoteDelimiterCandidates = (
  input: string,
): readonly SyntaxRepairCandidate[] => {
  const tokens = tokenizeRepairInput(input);
  const edits = tokens
    .filter(
      (token): token is RepairToken => token.kind === "syntax" && token.source === "'",
    )
    .map((token) => replaceEdit(token.startOffset, token.endOffset, '"'));

  if (edits.length === 0) {
    return [];
  }

  const repaired = applyEdits(input, edits);

  if (!isStrictJson(repaired)) {
    return [];
  }

  return [createCandidate("single-quote-delimiters", edits)];
};

const createCandidate = (
  ruleId: SyntaxRepairRuleId,
  edits: readonly SyntaxEdit[],
): SyntaxRepairCandidate => ({
  edits,
  ruleId,
  summary: RULE_SUMMARIES[ruleId],
});

const insertEdit = (offset: number, replacement: string): SyntaxEdit => ({
  endOffset: offset,
  replacement,
  startOffset: offset,
  type: "insert",
});

const removeEdit = (startOffset: number, endOffset: number): SyntaxEdit => ({
  endOffset,
  replacement: "",
  startOffset,
  type: "remove",
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

const isDataToken = (token: RepairToken): token is RepairDataToken =>
  token.kind !== "syntax";

const getCompleteDataStartOffset = (
  tokens: readonly RepairToken[],
  token: RepairDataToken,
): number | null => {
  if (token.kind !== "string") {
    return token.startOffset;
  }

  const openingDelimiter = tokens.find(
    (candidate) =>
      candidate.kind === "syntax" &&
      (candidate.source === "'" || candidate.source === '"') &&
      candidate.endOffset === token.startOffset,
  );

  return openingDelimiter?.startOffset ?? null;
};

const getCompleteDataEndOffset = (
  tokens: readonly RepairToken[],
  token: RepairDataToken,
): number | null => {
  if (token.kind !== "string") {
    return token.endOffset;
  }

  const closingDelimiter = tokens.find(
    (candidate) =>
      candidate.kind === "syntax" &&
      (candidate.source === "'" || candidate.source === '"') &&
      candidate.startOffset === token.endOffset,
  );

  return closingDelimiter?.endOffset ?? null;
};

const hasPreviousColon = (
  input: string,
  tokens: readonly RepairToken[],
  token: RepairDataToken,
): boolean => {
  const startOffset = getCompleteDataStartOffset(tokens, token) ?? token.startOffset;
  const previousOffset = findPreviousMeaningfulOffset(input, startOffset - 1);

  return previousOffset !== null && input[previousOffset] === ":";
};

const isObjectKeyContext = (
  input: string,
  tokens: readonly RepairToken[],
  token: RepairDataToken,
): boolean => {
  const startOffset = getCompleteDataStartOffset(tokens, token) ?? token.startOffset;
  const previousOffset = findPreviousMeaningfulOffset(input, startOffset - 1);

  return (
    previousOffset !== null &&
    (input[previousOffset] === "{" || input[previousOffset] === ",")
  );
};

const isOnlyWhitespace = (
  input: string,
  startOffset: number,
  endOffset: number,
): boolean => input.slice(startOffset, endOffset).trim().length === 0;

const findNextMeaningfulOffset = (
  input: string,
  startOffset: number,
): number | null => {
  for (let offset = startOffset; offset < input.length; offset += 1) {
    if (input[offset]?.trim() !== "") {
      return offset;
    }
  }

  return null;
};

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

const getMissingClosingDelimiters = (input: string): readonly string[] => {
  const stack: string[] = [];
  let offset = 0;

  while (offset < input.length) {
    const char = input[offset];

    if (char === undefined) {
      break;
    }

    if (char === '"' || char === "'") {
      offset = skipString(input, offset, char);
      continue;
    }

    if (char === "{") {
      stack.push("}");
    } else if (char === "[") {
      stack.push("]");
    } else if (char === "}" || char === "]") {
      const expected = stack.pop();

      if (expected !== char) {
        return [];
      }
    }

    offset += 1;
  }

  return stack.reverse();
};

const skipString = (
  input: string,
  openingOffset: number,
  delimiter: "'" | '"',
): number => {
  let offset = openingOffset + 1;
  let isEscaped = false;

  while (offset < input.length) {
    const char = input[offset];

    if (char === undefined) {
      return input.length;
    }

    if (isEscaped) {
      isEscaped = false;
      offset += 1;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      offset += 1;
      continue;
    }

    if (char === delimiter) {
      return offset + 1;
    }

    offset += 1;
  }

  return input.length;
};

const endsWithIncompleteSyntax = (input: string): boolean => {
  const previousOffset = findPreviousMeaningfulOffset(input, input.length - 1);

  return (
    previousOffset === null ||
    input[previousOffset] === "," ||
    input[previousOffset] === ":" ||
    input[previousOffset] === "{" ||
    input[previousOffset] === "["
  );
};

const applyEdits = (input: string, edits: readonly SyntaxEdit[]): string => {
  let output = "";
  let currentOffset = 0;

  for (const edit of [...edits].sort(
    (first, second) => first.startOffset - second.startOffset,
  )) {
    output += input.slice(currentOffset, edit.startOffset);
    output += edit.replacement;
    currentOffset = edit.endOffset;
  }

  output += input.slice(currentOffset);

  return output;
};

const isStrictJson = (input: string): boolean => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};
