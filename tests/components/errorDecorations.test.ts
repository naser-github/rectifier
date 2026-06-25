import { describe, expect, it } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import {
  buildErrorDecorations,
  firstConfirmedError,
} from "../../src/components/editor/errorDecorations";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDiagnostic = (
  overrides: Partial<Diagnostic> & { offset: number },
): Diagnostic => ({
  code: "json.test-error",
  message: "Test error",
  position: {
    offset: overrides.offset,
    line: 1,
    column: overrides.offset + 1,
  },
  reliability: "confirmed",
  repairState: "not-applicable",
  severity: "error",
  ...overrides,
});

const confirmedAt = (offset: number): Diagnostic =>
  makeDiagnostic({ offset, reliability: "confirmed" });

const followOnAt = (offset: number): Diagnostic =>
  makeDiagnostic({ offset, reliability: "uncertain-follow-on" });

const makeState = (text: string): EditorState =>
  EditorState.create({ doc: text, extensions: [json()] });

// ---------------------------------------------------------------------------
// firstConfirmedError
// ---------------------------------------------------------------------------

describe("firstConfirmedError", () => {
  it("returns undefined when diagnostics list is empty", () => {
    expect(firstConfirmedError([])).toBeUndefined();
  });

  it("returns undefined when only follow-on diagnostics exist", () => {
    expect(firstConfirmedError([followOnAt(5), followOnAt(10)])).toBeUndefined();
  });

  it("returns the sole confirmed diagnostic", () => {
    const d = confirmedAt(3);
    expect(firstConfirmedError([d])).toBe(d);
  });

  it("returns the confirmed diagnostic even when mixed with follow-ons", () => {
    const confirmed = confirmedAt(3);
    const result = firstConfirmedError([followOnAt(1), confirmed, followOnAt(5)]);
    expect(result).toBe(confirmed);
  });

  it("returns the earliest (smallest offset) confirmed diagnostic", () => {
    const a = confirmedAt(10);
    const b = confirmedAt(2);
    const c = confirmedAt(7);
    expect(firstConfirmedError([a, b, c])).toBe(b);
  });

  it("ignores follow-on diagnostics even when they have a smaller offset", () => {
    const followOn = followOnAt(0);
    const confirmed = confirmedAt(5);
    expect(firstConfirmedError([followOn, confirmed])).toBe(confirmed);
  });
});

// ---------------------------------------------------------------------------
// buildErrorDecorations — only confirmed are decorated
// ---------------------------------------------------------------------------

describe("buildErrorDecorations — reliability filtering", () => {
  it("returns empty decorations when no diagnostics provided", () => {
    const state = makeState('{"a":1}');
    const result = buildErrorDecorations([], state);
    // DecorationSet is a RangeSet; size 0 means no decorations
    expect(result.size).toBe(0);
  });

  it("returns empty decorations when only follow-on diagnostics provided", () => {
    const state = makeState('{"a":1}');
    const result = buildErrorDecorations([followOnAt(0)], state);
    expect(result.size).toBe(0);
  });

  it("decorates a confirmed diagnostic", () => {
    const text = '{"a":1 "b":2}';
    const state = makeState(text);
    const d = confirmedAt(7);
    const result = buildErrorDecorations([d], state);
    expect(result.size).toBeGreaterThan(0);
  });

  it("decorates confirmed diagnostics only, not follow-on ones", () => {
    const text = '{"a":1 "b":2}';
    const state = makeState(text);
    const confirmed = confirmedAt(7);
    const followOn = followOnAt(1);

    const withBoth = buildErrorDecorations([confirmed, followOn], state);
    const withConfirmedOnly = buildErrorDecorations([confirmed], state);

    // Same number of decorations — follow-on must not add any
    expect(withBoth.size).toBe(withConfirmedOnly.size);
  });

  it("produces decorations for each distinct confirmed diagnostic", () => {
    const text = '{"a":1 "b":2 "c":3}';
    const state = makeState(text);
    const d1 = confirmedAt(7);
    const d2 = confirmedAt(13);

    const singleResult = buildErrorDecorations([d1], state);
    const doubleResult = buildErrorDecorations([d1, d2], state);

    // Two confirmed diagnostics produce more (or equal) decorations than one
    expect(doubleResult.size).toBeGreaterThanOrEqual(singleResult.size);
    expect(doubleResult.size).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// buildErrorDecorations — offset-to-range mapping
// ---------------------------------------------------------------------------

describe("buildErrorDecorations — offset-to-range mapping", () => {
  it("clamps offset within document bounds", () => {
    // Offset beyond document end must not throw
    const text = '{"a":1}';
    const state = makeState(text);
    const beyond = confirmedAt(text.length + 100);
    expect(() => buildErrorDecorations([beyond], state)).not.toThrow();
  });

  it("handles offset at exactly 0", () => {
    const state = makeState("invalid json");
    const d = confirmedAt(0);
    expect(() => buildErrorDecorations([d], state)).not.toThrow();
    const result = buildErrorDecorations([d], state);
    expect(result.size).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Non-color cue — decorated spans carry a CSS class
// ---------------------------------------------------------------------------

describe("buildErrorDecorations — non-color cue (PRD §16)", () => {
  it("applies a CSS class that includes a non-color visual identifier", () => {
    const text = '{"a":1 "b":2}';
    const state = makeState(text);
    const d = confirmedAt(7);
    const result = buildErrorDecorations([d], state);

    // Iterate the RangeSet to find decoration specs
    let foundNonColorClass = false;
    result.between(0, state.doc.length, (_from, _to, value) => {
      const spec = (value as { spec?: { class?: string } }).spec;
      if (spec?.class !== undefined && spec.class !== "") {
        // Class name indicates error — must not be solely a color class
        // (We check it carries a meaningful semantic name like "error" or
        //  an underline marker, not just e.g. "cm-red")
        const cls = spec.class;
        const hasSemanticClass =
          cls.includes("error") ||
          cls.includes("underline") ||
          cls.includes("mark") ||
          cls.includes("diagnostic");
        if (hasSemanticClass) {
          foundNonColorClass = true;
        }
      }
    });

    expect(foundNonColorClass).toBe(true);
  });
});
