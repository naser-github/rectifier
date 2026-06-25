import "@testing-library/jest-dom/vitest";

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import { ErrorTray } from "../../src/components/errors/ErrorTray";

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
// Rendering diagnostics
// ---------------------------------------------------------------------------

describe("ErrorTray — rendering", () => {
  it("shows nothing when diagnostics list is empty", () => {
    const { container } = render(
      <ErrorTray diagnostics={[]} onFocusLocation={vi.fn()} />,
    );
    // No error items should appear
    expect(container.querySelector("li, [role='listitem']")).toBeNull();
  });

  it("displays the error message for each confirmed diagnostic", () => {
    const diagnostics: readonly Diagnostic[] = [
      makeDiagnostic({ message: "Missing comma between values." }),
      makeDiagnostic({
        message: "Expected a colon after property name.",
        position: { offset: 10, line: 3, column: 5 },
      }),
    ];

    render(<ErrorTray diagnostics={diagnostics} onFocusLocation={vi.fn()} />);

    expect(screen.getByText(/Missing comma between values/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Expected a colon after property name/i),
    ).toBeInTheDocument();
  });

  it("displays line and column for each diagnostic", () => {
    const d = makeDiagnostic({ position: { offset: 5, line: 2, column: 3 } });
    render(<ErrorTray diagnostics={[d]} onFocusLocation={vi.fn()} />);

    // Should show line 2 and column 3 somewhere
    expect(screen.getByText(/line\s*2/i)).toBeInTheDocument();
    expect(screen.getByText(/col(umn)?\s*3/i)).toBeInTheDocument();
  });

  it("renders a list with accessible role", () => {
    const d = makeDiagnostic();
    render(<ErrorTray diagnostics={[d]} onFocusLocation={vi.fn()} />);
    // Should have a list element
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("each error item has an accessible label", () => {
    const d = makeDiagnostic({ message: "Trailing comma is not allowed in JSON." });
    render(<ErrorTray diagnostics={[d]} onFocusLocation={vi.fn()} />);
    // The item or its button must have an accessible name
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    const firstButton = buttons[0];
    expect(firstButton).toBeDefined();
    if (firstButton !== undefined) {
      expect(firstButton).toHaveAccessibleName();
    }
  });
});

// ---------------------------------------------------------------------------
// Activation — native buttons are keyboard-activatable by the platform
// ---------------------------------------------------------------------------

describe("ErrorTray — activation", () => {
  it("calls onFocusLocation with the diagnostic's position on activation", () => {
    const onFocusLocation = vi.fn();
    const d = makeDiagnostic({ position: { offset: 7, line: 2, column: 4 } });

    render(<ErrorTray diagnostics={[d]} onFocusLocation={onFocusLocation} />);

    const buttons = screen.getAllByRole("button");
    const firstButton = buttons[0];
    expect(firstButton).toBeDefined();
    if (firstButton !== undefined) {
      fireEvent.click(firstButton);
    }

    expect(onFocusLocation).toHaveBeenCalledOnce();
    expect(onFocusLocation).toHaveBeenCalledWith(d.position);
  });

  it("renders each item as a native <button> so the platform makes it keyboard-activatable", () => {
    const d = makeDiagnostic();
    render(<ErrorTray diagnostics={[d]} onFocusLocation={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    const firstButton = buttons[0];
    expect(firstButton).toBeDefined();
    if (firstButton !== undefined) {
      // A native <button> element: Enter/Space activation and tab focus are
      // provided by the browser, so we assert the element type + accessible
      // name rather than synthesising keyboard events that prove nothing.
      expect(firstButton.tagName).toBe("BUTTON");
      expect(firstButton).toHaveAttribute("type", "button");
      expect(firstButton).toHaveAccessibleName();
      expect(firstButton).not.toHaveAttribute("aria-disabled", "true");
    }
  });

  it("calls onFocusLocation with correct position for the second of two items", () => {
    const onFocusLocation = vi.fn();
    const d1 = makeDiagnostic({ position: { offset: 5, line: 2, column: 3 } });
    const d2 = makeDiagnostic({
      position: { offset: 15, line: 4, column: 7 },
      message: "Second error.",
    });

    render(<ErrorTray diagnostics={[d1, d2]} onFocusLocation={onFocusLocation} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const secondButton = buttons[1];
    expect(secondButton).toBeDefined();
    if (secondButton !== undefined) {
      fireEvent.click(secondButton);
    }

    expect(onFocusLocation).toHaveBeenCalledWith(d2.position);
  });
});

// ---------------------------------------------------------------------------
// Accessibility — non-color error cue
// ---------------------------------------------------------------------------

describe("ErrorTray — accessibility", () => {
  it("does not rely on color alone — error indication is via text or icon", () => {
    const d = makeDiagnostic({ message: "Some error." });
    const { container } = render(
      <ErrorTray diagnostics={[d]} onFocusLocation={vi.fn()} />,
    );

    // There must be visible non-color content: the message text itself,
    // or an aria-label, or a non-color icon/glyph
    expect(container.textContent).toContain("Some error.");
  });

  it("items have visible focus (buttons are focusable DOM elements)", () => {
    const d = makeDiagnostic();
    render(<ErrorTray diagnostics={[d]} onFocusLocation={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    const firstButton = buttons[0];
    expect(firstButton).toBeDefined();
    if (firstButton !== undefined) {
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    }
  });
});
