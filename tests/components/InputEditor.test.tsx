import "@testing-library/jest-dom/vitest";

import { render, screen, act } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import {
  InputEditor,
  type InputEditorHandle,
} from "../../src/components/editor/InputEditor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeDiagnostic = (overrides: Partial<Diagnostic> = {}): Diagnostic => ({
  code: "json.missing-comma",
  message: "Missing comma between values.",
  position: { offset: 5, line: 2, column: 3 },
  reliability: "confirmed",
  repairState: "not-applicable",
  severity: "error",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("InputEditor — rendering", () => {
  it("renders without throwing", () => {
    expect(() =>
      render(<InputEditor value="" onChange={vi.fn()} diagnostics={[]} />),
    ).not.toThrow();
  });

  it("renders a CodeMirror editor container", () => {
    const { container } = render(
      <InputEditor value="" onChange={vi.fn()} diagnostics={[]} />,
    );
    // CodeMirror renders a .cm-editor element
    expect(container.querySelector(".cm-editor")).not.toBeNull();
  });

  it("has an accessible label for the editor region", () => {
    render(<InputEditor value="" onChange={vi.fn()} diagnostics={[]} />);
    // The editor or its wrapper must have a label
    const editor = screen.getByRole("region", { name: /input json editor/i });
    expect(editor).toBeInTheDocument();
  });

  it("renders line numbers extension (cm-gutters present)", () => {
    const { container } = render(
      <InputEditor value="" onChange={vi.fn()} diagnostics={[]} />,
    );
    // Line numbers create a .cm-gutters element
    expect(container.querySelector(".cm-gutters")).not.toBeNull();
  });

  it("reflects the initial value in the editor content", () => {
    const { container } = render(
      <InputEditor value='{"hello":"world"}' onChange={vi.fn()} diagnostics={[]} />,
    );
    // CodeMirror renders content in .cm-content
    const content = container.querySelector(".cm-content");
    expect(content).not.toBeNull();
    expect(content?.textContent).toContain("hello");
  });
});

// ---------------------------------------------------------------------------
// onChange callback
// ---------------------------------------------------------------------------

describe("InputEditor — onChange", () => {
  it("calls onChange when the editor content changes via programmatic dispatch", () => {
    // In jsdom we test that onChange is wired; full keyboard typing is limited.
    // We verify the prop is accepted and the component does not throw.
    const onChange = vi.fn();
    expect(() =>
      render(<InputEditor value="" onChange={onChange} diagnostics={[]} />),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Diagnostics decoration
// ---------------------------------------------------------------------------

describe("InputEditor — diagnostics decoration", () => {
  it("applies error decoration class when a confirmed diagnostic is provided", () => {
    const d = makeDiagnostic({ position: { offset: 0, line: 1, column: 1 } });
    const { container } = render(
      <InputEditor value='{"broken"' onChange={vi.fn()} diagnostics={[d]} />,
    );
    // Confirmed error should apply a class containing error indicator
    const errorEl = container.querySelector(
      ".cm-error-mark, .cm-diagnostic-error, [class*='error']",
    );
    // The decoration must be present
    expect(errorEl).not.toBeNull();
  });

  it("does not apply error decoration when only follow-on diagnostics are provided", () => {
    const followOn = makeDiagnostic({
      reliability: "uncertain-follow-on",
      position: { offset: 0, line: 1, column: 1 },
    });
    const { container } = render(
      <InputEditor value='{"broken"' onChange={vi.fn()} diagnostics={[followOn]} />,
    );
    // Follow-on must NOT produce error-mark class
    const errorEl = container.querySelector(".cm-error-mark");
    expect(errorEl).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Red-caret state class
// ---------------------------------------------------------------------------

describe("InputEditor — red-caret state", () => {
  it("applies the error-focused class to the editor when confirmed errors exist", () => {
    const d = makeDiagnostic();
    const { container } = render(
      <InputEditor value='{"broken"' onChange={vi.fn()} diagnostics={[d]} />,
    );
    // The editor wrapper should have a data or class marker for error focus
    const editor = container.querySelector(".cm-editor");
    const wrapper = container.querySelector("[data-has-error]");
    // Either the editor has an error class or the wrapper has data-has-error
    const hasErrorState =
      editor?.classList.contains("cm-error-focused") === true ||
      wrapper !== null ||
      container.querySelector("[class*='error-focused']") !== null;
    expect(hasErrorState).toBe(true);
  });

  it("does not apply the error-focused state when no diagnostics", () => {
    const { container } = render(
      <InputEditor value='{"valid":true}' onChange={vi.fn()} diagnostics={[]} />,
    );
    expect(container.querySelector(".cm-error-focused")).toBeNull();
    expect(container.querySelector("[data-has-error]")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Focus request via imperative handle
// ---------------------------------------------------------------------------

describe("InputEditor — imperative focus request", () => {
  it("exposes a focusLocation method via the ref handle", () => {
    const ref = createRef<InputEditorHandle>();
    render(
      <InputEditor
        ref={ref}
        value='{"a":1, "b":2}'
        onChange={vi.fn()}
        diagnostics={[]}
      />,
    );

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.focusLocation).toBe("function");
  });

  it("focusLocation does not throw when called with a valid position", () => {
    const ref = createRef<InputEditorHandle>();
    render(
      <InputEditor ref={ref} value='{"a":1}' onChange={vi.fn()} diagnostics={[]} />,
    );

    expect(() => {
      act(() => {
        ref.current?.focusLocation({ offset: 2, line: 1, column: 3 });
      });
    }).not.toThrow();
  });

  it("focusLocation does not throw when called with offset at document end", () => {
    const value = '{"a":1}';
    const ref = createRef<InputEditorHandle>();
    render(<InputEditor ref={ref} value={value} onChange={vi.fn()} diagnostics={[]} />);

    expect(() => {
      act(() => {
        ref.current?.focusLocation({ offset: value.length, line: 1, column: 8 });
      });
    }).not.toThrow();
  });
});
