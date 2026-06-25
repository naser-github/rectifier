import type { RepairAnalysisResult } from "../../src/domain/repair";

export type RepairCaseGroup = "safe" | "ambiguous" | "manual";

export interface RepairCaseExpectation {
  readonly kind: RepairAnalysisResult["kind"];
  readonly reason: string;
}

export interface RepairCase {
  readonly description: string;
  readonly expected: RepairCaseExpectation;
  readonly id: string;
  readonly input: string;
}

export interface RepairCaseMatrix {
  readonly ambiguous: readonly RepairCase[];
  readonly manual: readonly RepairCase[];
  readonly safe: readonly RepairCase[];
}

export const repairCases = {
  safe: [
    {
      description: "Missing comma between complete object properties.",
      expected: {
        kind: "safe",
        reason:
          "One comma can be inserted between two complete properties without changing data tokens.",
      },
      id: "missing-comma-between-properties",
      input: '{\n  "name": "John"\n  "active": true\n}',
    },
    {
      description: "Trailing comma after final object property.",
      expected: {
        kind: "safe",
        reason: "One trailing comma can be removed without changing data tokens.",
      },
      id: "trailing-comma-in-object",
      input: '{\n  "name": "John",\n}',
    },
    {
      description: "Object key and value separated by whitespace instead of a colon.",
      expected: {
        kind: "safe",
        reason:
          "One colon can be inserted after a complete string key before a complete value.",
      },
      id: "missing-colon-after-key",
      input: '{\n  "name" "John"\n}',
    },
    {
      description: "Object has a deterministic missing closing delimiter.",
      expected: {
        kind: "safe",
        reason:
          "One closing object delimiter can be appended when all data tokens and nested delimiters are complete.",
      },
      id: "missing-closing-object-delimiter",
      input: '{\n  "name": "John"',
    },
    {
      description:
        "Single-quote delimiters enclose unchanged key and string value content.",
      expected: {
        kind: "safe",
        reason:
          "Single-quote delimiters can become double-quote delimiters when enclosed source characters stay unchanged.",
      },
      id: "single-quote-string-delimiters",
      input: "{'name': 'John'}",
    },
  ],
  ambiguous: [
    {
      description:
        "Adjacent complete values can be interpreted through more than one syntax-only structure.",
      expected: {
        kind: "ambiguous",
        reason:
          "More than one verified syntax-only structure may preserve the same data tokens.",
      },
      id: "adjacent-values-ambiguous-structure",
      input: '{\n  "price": 10 20\n}',
    },
  ],
  manual: [
    {
      description:
        "A single quoted token inside an object has unclear key/value intent.",
      expected: {
        kind: "manual",
        reason: "The intended JSON key, value, or structure is unclear.",
      },
      id: "single-quoted-unknown-structure",
      input: "{'jhon'}",
    },
    {
      description: "Unknown bare value cannot be guessed.",
      expected: {
        kind: "manual",
        reason:
          "Unknown bare values require user editing because repair would invent or change data.",
      },
      id: "unknown-bare-value",
      input: '{ "name": John }',
    },
    {
      description: "Adjacent top-level values have no reliable target structure.",
      expected: {
        kind: "manual",
        reason: "Adjacent values without an existing structure require user intent.",
      },
      id: "adjacent-values-without-structure",
      input: "1 2",
    },
    {
      description:
        "Unterminated string content cannot be repaired without guessing text.",
      expected: {
        kind: "manual",
        reason: "Repairing an unterminated string could change protected text content.",
      },
      id: "unterminated-string",
      input: '{ "name": "John }',
    },
    {
      description: "Invalid escape sequence inside protected string content.",
      expected: {
        kind: "manual",
        reason:
          "Invalid escapes are protected string content and must not be rewritten.",
      },
      id: "invalid-escape",
      input: '{ "name": "Jo\\qhn" }',
    },
    {
      description: "Broken Unicode escape inside protected string content.",
      expected: {
        kind: "manual",
        reason:
          "Broken Unicode escapes are protected string content and must not be rewritten.",
      },
      id: "broken-unicode-escape",
      input: '{ "name": "\\u12" }',
    },
    {
      description:
        "A numeric rewrite from 1 to 1.0 would preserve value but change exact data text.",
      expected: {
        kind: "manual",
        reason:
          "Semantically equivalent number rewrites still change exact protected source content.",
      },
      id: "number-rewrite-one-to-one-point-zero",
      input: '{ "amount": 1. }',
    },
    {
      description:
        "A numeric rewrite from exponent form to integer text would change exact data text.",
      expected: {
        kind: "manual",
        reason: "Number formatting changes are protected data-token changes.",
      },
      id: "number-rewrite-exponent-to-integer",
      input: '{ "amount": 1e }',
    },
    {
      description:
        "A string rewrite from a literal character to a Unicode escape changes exact data text.",
      expected: {
        kind: "manual",
        reason:
          "String escape rewrites are protected source-content changes even when decoded values match.",
      },
      id: "string-rewrite-escaped-unicode",
      input: '{ "letter": "\\u006" }',
    },
  ],
} satisfies RepairCaseMatrix;
