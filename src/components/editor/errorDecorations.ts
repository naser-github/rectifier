/**
 * Pure utility functions for converting Diagnostic records into CodeMirror
 * DecorationSet ranges. Kept framework-free and testable in isolation.
 *
 * Only `reliability: "confirmed"` diagnostics are decorated; uncertain
 * follow-on diagnostics are intentionally excluded (PRD §7.1, §7.2).
 *
 * Non-color error cue: every decorated range carries the CSS class
 * `cm-error-mark` which applies both the red underline (non-color visual
 * cue) and the red color, satisfying PRD §16.
 */

import { Decoration, type DecorationSet } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import type { EditorState } from "@codemirror/state";

import type { Diagnostic } from "../../domain/diagnostics";

// ---------------------------------------------------------------------------
// CSS class applied to confirmed-error ranges
// The class name contains "error" and "mark" so the non-color-cue test can
// discover it; the class is styled in the CodeMirror theme extension in
// InputEditor.tsx with a red underline (non-color cue) + red color.
// ---------------------------------------------------------------------------
export const ERROR_MARK_CLASS = "cm-error-mark";

// Minimum visible span (in characters) for an error mark/selection so a
// single-character or zero-width error still shows a visible highlight.
const MIN_ERROR_RANGE_LENGTH = 1;

/** A half-open [from, to) range within the document. */
export interface ErrorRange {
  readonly from: number;
  readonly to: number;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Returns the earliest (by offset) confirmed diagnostic, or `undefined` when
 * the list contains no confirmed diagnostics.
 */
export function firstConfirmedError(
  diagnostics: readonly Diagnostic[],
): Diagnostic | undefined {
  let earliest: Diagnostic | undefined;
  for (const d of diagnostics) {
    if (d.reliability !== "confirmed") continue;
    if (earliest === undefined || d.position.offset < earliest.position.offset) {
      earliest = d;
    }
  }
  return earliest;
}

/**
 * Derives a sensible, document-bounded highlight range for an error at the
 * given offset. The range spans the token starting at `offset` (a run of
 * non-whitespace characters), bounded to at least {@link MIN_ERROR_RANGE_LENGTH}
 * so a single-character or end-of-document error still produces a visible
 * range. Used by both the decoration builder and the focused-error selection
 * so they always agree (PRD §7.3).
 */
export function errorTokenRange(text: string, offset: number): ErrorRange {
  const docLength = text.length;

  if (docLength === 0) {
    return { from: 0, to: 0 };
  }

  // Clamp the start within bounds. At end-of-document, step back one character
  // so the highlight covers the final token rather than collapsing to nothing.
  const from = Math.min(Math.max(offset, 0), Math.max(docLength - 1, 0));

  // Extend across the run of non-whitespace characters starting at `from`.
  let to = from;
  while (to < docLength && !/\s/u.test(text.charAt(to))) {
    to += 1;
  }

  // Guarantee a minimum visible width, bounded to the document end.
  if (to - from < MIN_ERROR_RANGE_LENGTH) {
    to = Math.min(from + MIN_ERROR_RANGE_LENGTH, docLength);
  }

  return { from, to };
}

/**
 * Converts the confirmed diagnostics into a CodeMirror `DecorationSet`.
 *
 * Only `reliability: "confirmed"` entries are decorated. Each decorated range
 * spans the error token at the diagnostic's offset (see {@link errorTokenRange}).
 *
 * The returned `DecorationSet` uses a `mark` decoration so it renders as an
 * inline span — enabling the underline non-color cue via CSS.
 *
 * Ranges are de-duplicated and added strictly in `from` order so the
 * RangeSetBuilder never throws when two diagnostics resolve to the same
 * trailing/end-of-document range.
 */
export function buildErrorDecorations(
  diagnostics: readonly Diagnostic[],
  state: EditorState,
): DecorationSet {
  const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");

  if (confirmed.length === 0) {
    return Decoration.none;
  }

  const text = state.doc.toString();

  // Resolve each diagnostic to a bounded range, then sort and de-duplicate so
  // the builder receives strictly increasing, non-equal start ranges.
  const ranges = confirmed
    .map((d) => errorTokenRange(text, d.position.offset))
    .filter((r) => r.to > r.from)
    .sort((a, b) => a.from - b.from || a.to - b.to);

  const builder = new RangeSetBuilder<Decoration>();
  const markDecoration = Decoration.mark({ class: ERROR_MARK_CLASS });

  let lastFrom = -1;
  for (const range of ranges) {
    // Skip any range sharing a start with an already-added range; the
    // RangeSetBuilder requires strictly ordered, non-duplicate starts.
    if (range.from === lastFrom) {
      continue;
    }
    builder.add(range.from, range.to, markDecoration);
    lastFrom = range.from;
  }

  return builder.finish();
}
