import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Diagnostic } from "../../src/domain/diagnostics";
import { InputPanel } from "../../src/components/editor/InputPanel";
import { TooltipProvider } from "../../src/components/ui/Tooltip";

// ---------------------------------------------------------------------------
// Tooltip wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { readonly children: ReactNode }): ReactNode {
  return <TooltipProvider>{children}</TooltipProvider>;
}

const r = (ui: ReactNode) => render(ui, { wrapper: Wrapper });

// ---------------------------------------------------------------------------
// Stub props
// ---------------------------------------------------------------------------

const baseProps = {
  input: '{"a":1}',
  diagnostics: [] as readonly Diagnostic[],
  validationState: "validated" as const,
  isExample: false,
  sizeError: null,
  onInputChange: vi.fn(),
  onUpload: vi.fn(),
  onClear: vi.fn(),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("InputPanel", () => {
  it("renders the panel title", () => {
    r(<InputPanel {...baseProps} />);
    expect(screen.getByText("Input JSON")).toBeInTheDocument();
  });

  it("renders the Upload and Clear icon buttons", () => {
    r(<InputPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: "Upload JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear input" })).toBeInTheDocument();
  });

  it("shows 'Valid JSON' status when JSON is valid", () => {
    r(<InputPanel {...baseProps} />);
    expect(screen.getByText("Valid JSON")).toBeInTheDocument();
  });

  it("shows error count when there are diagnostics", () => {
    const diagnostic: Diagnostic = {
      code: "test-error",
      message: "Test error",
      position: { offset: 0, line: 1, column: 1 },
      reliability: "confirmed",
      repairState: "not-applicable",
      severity: "error",
    };

    r(<InputPanel {...baseProps} diagnostics={[diagnostic]} />);
    expect(screen.getByText("1 validation error")).toBeInTheDocument();
  });

  it("shows 'Example JSON' when isExample is true", () => {
    r(<InputPanel {...baseProps} isExample={true} />);
    expect(screen.getByText("Example JSON")).toBeInTheDocument();
  });

  it("shows 'Checking JSON…' while validating", () => {
    r(<InputPanel {...baseProps} validationState="validating" />);
    expect(screen.getByText("Checking JSON…")).toBeInTheDocument();
  });

  it("shows 'Input too large' when sizeError is set", () => {
    r(<InputPanel {...baseProps} sizeError="File exceeds 10 MB limit." />);
    expect(screen.getByText("Input too large")).toBeInTheDocument();
  });

  it("shows 'No input' when input is empty", () => {
    r(<InputPanel {...baseProps} input="" />);
    expect(screen.getByText("No input")).toBeInTheDocument();
  });

  it("calls onUpload when Upload button is clicked", () => {
    const onUpload = vi.fn();
    r(<InputPanel {...baseProps} onUpload={onUpload} />);
    screen.getByRole("button", { name: "Upload JSON" }).click();
    expect(onUpload).toHaveBeenCalledOnce();
  });

  it("calls onClear when Clear button is clicked", () => {
    const onClear = vi.fn();
    r(<InputPanel {...baseProps} onClear={onClear} />);
    screen.getByRole("button", { name: "Clear input" }).click();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("renders the InputEditor region", () => {
    r(<InputPanel {...baseProps} />);
    expect(
      screen.getByRole("region", { name: /input json editor/i }),
    ).toBeInTheDocument();
  });
});
