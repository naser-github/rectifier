import type { RepairAnalysisResult, RepairEligibility } from "../../domain/repair";
import { generateVerifiedRepairCandidates } from "./candidates";
import type { RepairDataToken, RepairToken } from "./tokenizer";
import { tokenizeRepairInput } from "./tokenizer";

export interface RepairEligibilityInput {
  readonly diagnosticCode: string;
  readonly input: string;
}

const DIAGNOSTIC_RULES: Readonly<Record<string, string>> = {
  "json.missing-closing-delimiter": "missing-closing-delimiter",
  "json.missing-colon": "missing-colon",
  "json.missing-comma": "missing-comma",
  "json.single-quote-delimiters": "single-quote-delimiters",
  "json.trailing-comma": "trailing-comma",
};

export const analyzeJsonRepair = (input: string): RepairAnalysisResult => {
  if (isStrictJson(input)) {
    return {
      guidance: "This input is already valid JSON, so Repair JSON is not needed.",
      kind: "manual",
      reason: "valid-json",
    };
  }

  const candidates = generateVerifiedRepairCandidates(input);

  if (candidates.length === 1) {
    const candidate = candidates[0];

    if (candidate !== undefined) {
      return {
        candidate,
        kind: "safe",
      };
    }
  }

  if (candidates.length > 1) {
    return {
      choices: candidates,
      kind: "ambiguous",
      manualGuidance:
        "More than one syntax-only repair preserves the same data tokens. Choose the intended structure or edit manually.",
    };
  }

  return {
    guidance:
      "Rectifier cannot prove a safe syntax-only repair for this input. Edit the JSON manually.",
    kind: "manual",
    reason: "unverified",
  };
};

export const classifyRepairEligibility = ({
  diagnosticCode,
  input,
}: RepairEligibilityInput): RepairEligibility => {
  const ruleId = DIAGNOSTIC_RULES[diagnosticCode];

  if (ruleId === undefined) {
    return {
      diagnosticCode,
      isEligible: false,
      reason: "unsupported-diagnostic",
    };
  }

  if (isStrictJson(input)) {
    return {
      diagnosticCode,
      isEligible: false,
      reason: "valid-json",
    };
  }

  if (!mayRuleApply(input, ruleId)) {
    return {
      diagnosticCode,
      isEligible: false,
      reason: "ambiguous-syntax",
    };
  }

  return {
    diagnosticCode,
    isEligible: true,
    ruleId,
  };
};

const mayRuleApply = (input: string, ruleId: string): boolean => {
  switch (ruleId) {
    case "missing-comma":
      return hasAdjacentDataTokens(input, "colon-before-first");
    case "missing-colon":
      return hasAdjacentDataTokens(input, "object-key-before-first");
    case "trailing-comma":
      return /,\s*[}\]]/u.test(input);
    case "missing-closing-delimiter":
      return hasUnclosedDelimiter(input);
    case "single-quote-delimiters":
      return input.includes("'");
    default:
      return false;
  }
};

const hasAdjacentDataTokens = (
  input: string,
  context: "colon-before-first" | "object-key-before-first",
): boolean => {
  const tokens = tokenizeRepairInput(input);
  const dataTokens = tokens.filter(isDataToken);

  for (let index = 0; index < dataTokens.length - 1; index += 1) {
    const current = dataTokens[index];
    const next = dataTokens[index + 1];

    if (current === undefined || next === undefined) {
      continue;
    }

    const currentEnd = getCompleteDataEndOffset(input, current);
    const nextStart = getCompleteDataStartOffset(input, next);

    if (
      currentEnd === null ||
      nextStart === null ||
      input.slice(currentEnd, nextStart).trim().length > 0
    ) {
      continue;
    }

    const currentStart =
      getCompleteDataStartOffset(input, current) ?? current.startOffset;
    const previousOffset = findPreviousMeaningfulOffset(input, currentStart - 1);

    if (
      context === "colon-before-first" &&
      previousOffset !== null &&
      input[previousOffset] === ":"
    ) {
      return true;
    }

    if (
      context === "object-key-before-first" &&
      current.kind === "string" &&
      previousOffset !== null &&
      (input[previousOffset] === "{" || input[previousOffset] === ",")
    ) {
      return true;
    }
  }

  return false;
};

const isDataToken = (token: RepairToken): token is RepairDataToken =>
  token.kind !== "syntax";

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

const hasUnclosedDelimiter = (input: string): boolean => {
  let objectDepth = 0;
  let arrayDepth = 0;
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
      objectDepth += 1;
    } else if (char === "}") {
      objectDepth -= 1;
    } else if (char === "[") {
      arrayDepth += 1;
    } else if (char === "]") {
      arrayDepth -= 1;
    }

    offset += 1;
  }

  return objectDepth > 0 || arrayDepth > 0;
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

const isStrictJson = (input: string): boolean => {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
};
