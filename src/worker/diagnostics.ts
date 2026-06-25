import { parse, type ParseError } from "jsonc-parser";

import type { Diagnostic, DiagnosticReliability } from "../domain/diagnostics";

// ---------------------------------------------------------------------------
// ParseErrorCode numeric values (const enum — not available at runtime from
// type imports, so we redeclare the subset we need as a plain object).
// Verified against jsonc-parser source (lib/esm/impl/parser.js).
// ---------------------------------------------------------------------------
const PC = {
  InvalidSymbol: 1,
  PropertyNameExpected: 3,
  ValueExpected: 4,
  ColonExpected: 5,
  CommaExpected: 6,
  CloseBraceExpected: 7,
  CloseBracketExpected: 8,
  EndOfFileExpected: 9,
  InvalidCommentToken: 10,
  UnexpectedEndOfComment: 11,
  UnexpectedEndOfString: 12,
  UnexpectedEndOfNumber: 13,
  InvalidUnicode: 14,
  InvalidEscapeCharacter: 15,
  InvalidCharacter: 16,
} as const;

// ---------------------------------------------------------------------------
// Diagnostic codes produced by this module. They must match the keys in the
// engine's DIAGNOSTIC_RULES table for eligibility to work.
// ---------------------------------------------------------------------------
const DIAGNOSTIC_CODES = {
  MISSING_COMMA: "json.missing-comma",
  TRAILING_COMMA: "json.trailing-comma",
  MISSING_COLON: "json.missing-colon",
  MISSING_CLOSING_BRACE: "json.missing-closing-delimiter",
  MISSING_CLOSING_BRACKET: "json.missing-closing-delimiter",
  SINGLE_QUOTE_DELIMITERS: "json.single-quote-delimiters",
  INVALID_COMMENT: "json.invalid-comment",
  VALUE_EXPECTED: "json.value-expected",
  PROPERTY_NAME_EXPECTED: "json.property-name-expected",
  END_OF_FILE_EXPECTED: "json.end-of-file-expected",
  INVALID_SYMBOL: "json.invalid-symbol",
  UNEXPECTED_END_OF_STRING: "json.unexpected-end-of-string",
  UNEXPECTED_END_OF_NUMBER: "json.unexpected-end-of-number",
  UNEXPECTED_END_OF_COMMENT: "json.unexpected-end-of-comment",
  INVALID_UNICODE: "json.invalid-unicode",
  INVALID_ESCAPE_CHARACTER: "json.invalid-escape-character",
  INVALID_CHARACTER: "json.invalid-character",
} as const;

// ---------------------------------------------------------------------------
// Plain human-readable messages per ParseErrorCode
// ---------------------------------------------------------------------------
const MESSAGES: Readonly<Record<number, string>> = {
  [PC.InvalidSymbol]: "This character is not valid here.",
  [PC.PropertyNameExpected]: "Expected a property name.",
  [PC.ValueExpected]: "Expected a value here.",
  [PC.ColonExpected]: "Expected a colon after the property name.",
  [PC.CommaExpected]: "Missing comma.",
  [PC.CloseBraceExpected]: "This object is missing a closing brace.",
  [PC.CloseBracketExpected]: "This array is missing a closing bracket.",
  [PC.EndOfFileExpected]: "Unexpected content after the end of the JSON.",
  [PC.InvalidCommentToken]: "Comments are not allowed in JSON.",
  [PC.UnexpectedEndOfComment]: "The comment is not closed.",
  [PC.UnexpectedEndOfString]: "The string is not closed.",
  [PC.UnexpectedEndOfNumber]: "The number ended unexpectedly.",
  [PC.InvalidUnicode]: "Invalid Unicode escape sequence.",
  [PC.InvalidEscapeCharacter]: "Invalid escape character in string.",
  [PC.InvalidCharacter]: "Unexpected character.",
};

// ---------------------------------------------------------------------------
// Diagnostic codes per ParseErrorCode
// ---------------------------------------------------------------------------
const CODES: Readonly<Record<number, string>> = {
  [PC.InvalidSymbol]: DIAGNOSTIC_CODES.INVALID_SYMBOL,
  [PC.PropertyNameExpected]: DIAGNOSTIC_CODES.PROPERTY_NAME_EXPECTED,
  [PC.ValueExpected]: DIAGNOSTIC_CODES.VALUE_EXPECTED,
  [PC.ColonExpected]: DIAGNOSTIC_CODES.MISSING_COLON,
  [PC.CommaExpected]: DIAGNOSTIC_CODES.MISSING_COMMA,
  [PC.CloseBraceExpected]: DIAGNOSTIC_CODES.MISSING_CLOSING_BRACE,
  [PC.CloseBracketExpected]: DIAGNOSTIC_CODES.MISSING_CLOSING_BRACKET,
  [PC.EndOfFileExpected]: DIAGNOSTIC_CODES.END_OF_FILE_EXPECTED,
  [PC.InvalidCommentToken]: DIAGNOSTIC_CODES.INVALID_COMMENT,
  [PC.UnexpectedEndOfComment]: DIAGNOSTIC_CODES.UNEXPECTED_END_OF_COMMENT,
  [PC.UnexpectedEndOfString]: DIAGNOSTIC_CODES.UNEXPECTED_END_OF_STRING,
  [PC.UnexpectedEndOfNumber]: DIAGNOSTIC_CODES.UNEXPECTED_END_OF_NUMBER,
  [PC.InvalidUnicode]: DIAGNOSTIC_CODES.INVALID_UNICODE,
  [PC.InvalidEscapeCharacter]: DIAGNOSTIC_CODES.INVALID_ESCAPE_CHARACTER,
  [PC.InvalidCharacter]: DIAGNOSTIC_CODES.INVALID_CHARACTER,
};

// ---------------------------------------------------------------------------
// ParseErrorCodes that are considered "first" (confirmed) errors.
// Secondary/cascading parse errors the library emits after a primary error
// are treated as uncertain follow-ons. The list of primary codes are the ones
// that definitively locate a real syntax problem.
// ---------------------------------------------------------------------------
const CONFIRMED_ERROR_CODES = new Set<number>([
  PC.ColonExpected,
  PC.CloseBraceExpected,
  PC.CloseBracketExpected,
  PC.InvalidCommentToken,
  PC.UnexpectedEndOfComment,
  PC.UnexpectedEndOfString,
  PC.UnexpectedEndOfNumber,
  PC.InvalidUnicode,
  PC.InvalidEscapeCharacter,
  PC.InvalidCharacter,
  PC.InvalidSymbol,
]);

// ---------------------------------------------------------------------------
// Trailing-comma detection
//
// The parser reports PropertyNameExpected (3) or ValueExpected (4) at the
// closing delimiter position when a trailing comma is present:
//   {"a":1,}  -> errors at offset 7 (the `}`)
//   [1,2,]    -> error at offset 5 (the `]`)
//
// We verify a true trailing comma by confirming:
//   1. The character at (or the next non-whitespace after) `offset` is `}` or `]`.
//   2. The character immediately before `offset` (ignoring whitespace) is `,`.
// ---------------------------------------------------------------------------
const isTrailingComma = (text: string, offset: number): boolean => {
  // Find the next non-whitespace at or after offset
  let closingChar: string | undefined;
  for (let i = offset; i < text.length; i++) {
    const ch = text[i];
    if (ch !== " " && ch !== "\t" && ch !== "\r" && ch !== "\n") {
      closingChar = ch;
      break;
    }
  }

  if (closingChar !== "}" && closingChar !== "]") {
    return false;
  }

  // Verify the char before offset is a comma
  for (let i = offset - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === undefined) {
      break;
    }
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      continue;
    }
    return ch === ",";
  }

  return false;
};

// ---------------------------------------------------------------------------
// Position: compute 1-based line and column from a 0-based character offset.
// ---------------------------------------------------------------------------
const computePosition = (
  text: string,
  offset: number,
): { readonly line: number; readonly column: number } => {
  let line = 1;
  let column = 1;

  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse `text` strictly (comments and trailing commas disallowed) and return
 * a list of `Diagnostic` values. Reliably located errors are marked
 * `"confirmed"`; uncertain follow-on errors are marked
 * `"uncertain-follow-on"`. The list is empty for valid JSON.
 *
 * Repair state is NOT set here — callers must apply engine eligibility.
 * This function maps ONLY confirmed parser errors to Diagnostics.
 */
export const parseDiagnostics = (text: string): readonly Diagnostic[] => {
  const errors: ParseError[] = [];

  parse(text, errors, {
    allowEmptyContent: false,
    allowTrailingComma: false,
    disallowComments: true,
  });

  if (errors.length === 0) {
    return [];
  }

  // The first error is always the most reliable root cause. Subsequent errors
  // from the fault-tolerant parser may be follow-ons caused by recovery.
  // We mark only the first error as confirmed unless additional errors are
  // independently recoverable primary errors (e.g., end-of-file after an
  // object-level error is a follow-on; a comment error anywhere is its own
  // confirmed location).
  //
  // Strategy: we treat each error as confirmed if its code is in
  // CONFIRMED_ERROR_CODES AND it is the first error OR it does not look like
  // a cascading structural mismatch. CommaExpected emitted by the parser is
  // ambiguous — it may be a real missing comma or a follow-on from an earlier
  // parse recovery. We check the source to distinguish trailing-comma
  // (the offset is on or after a `,`) from a real missing comma.

  const diagnostics: Diagnostic[] = [];

  let seenConfirmed = false;

  for (const error of errors) {
    const errorCode: number = error.error;
    const offset = error.offset;

    // Check if this is a trailing comma situation:
    // The parser reports CommaExpected (6) when it sees `}` or `]` where a
    // value is expected after a comma — i.e., the trailing comma case.
    // We detect this by checking if the char BEFORE the error position is `,`.
    let diagnosticCode = CODES[errorCode] ?? DIAGNOSTIC_CODES.INVALID_SYMBOL;
    let message = MESSAGES[errorCode] ?? "Unexpected syntax error.";

    if (errorCode === PC.InvalidSymbol && text[offset] === "'") {
      // Single-quote delimiter: jsonc-parser emits InvalidSymbol for `'`.
      // Map to the engine-recognized diagnostic code for the single-quote rule.
      diagnosticCode = DIAGNOSTIC_CODES.SINGLE_QUOTE_DELIMITERS;
      message = "Single quotes are not valid JSON string delimiters.";
    } else if (
      (errorCode === PC.ValueExpected || errorCode === PC.PropertyNameExpected) &&
      isTrailingComma(text, offset)
    ) {
      diagnosticCode = DIAGNOSTIC_CODES.TRAILING_COMMA;
      message = "Trailing comma is not allowed in JSON.";
    }

    // Determine reliability: the first confirmed-code error is always
    // confirmed. Subsequent errors may be follow-ons from parser recovery.
    const isConfirmedCode = CONFIRMED_ERROR_CODES.has(errorCode);
    // CommaExpected and ValueExpected (once we reclassify trailing commas)
    // can be confirmed as the first primary diagnostic.
    const isPrimaryError =
      isConfirmedCode ||
      errorCode === PC.CommaExpected ||
      errorCode === PC.ValueExpected ||
      errorCode === PC.PropertyNameExpected ||
      errorCode === PC.EndOfFileExpected;

    let reliability: DiagnosticReliability;

    if (!seenConfirmed && isPrimaryError) {
      reliability = "confirmed";
      seenConfirmed = true;
    } else if (
      seenConfirmed &&
      // Independent error types (comment errors, string errors) are each
      // their own confirmed location even after a prior confirmed error.
      (errorCode === PC.InvalidCommentToken ||
        errorCode === PC.UnexpectedEndOfComment ||
        errorCode === PC.UnexpectedEndOfString ||
        errorCode === PC.InvalidUnicode ||
        errorCode === PC.InvalidEscapeCharacter ||
        errorCode === PC.InvalidCharacter)
    ) {
      reliability = "confirmed";
    } else {
      reliability = "uncertain-follow-on";
    }

    const { line, column } = computePosition(text, offset);

    diagnostics.push({
      code: diagnosticCode,
      message,
      position: { column, line, offset },
      reliability,
      // repairState is set by the caller after engine eligibility is resolved
      repairState: "not-applicable",
      severity: "error",
    });
  }

  return diagnostics;
};
