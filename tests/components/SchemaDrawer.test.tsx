import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SchemaDrawer } from "../../src/components/schema/SchemaDrawer";
import { TooltipProvider } from "../../src/components/ui/Tooltip";

beforeEach(() => {
  class MockResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    observe(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unobserve(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect(): void {}
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

function Wrapper({ children }: { readonly children: ReactNode }): ReactNode {
  return <TooltipProvider>{children}</TooltipProvider>;
}

const renderWithTooltip = (ui: ReactNode) => render(ui, { wrapper: Wrapper });

const baseProps = {
  open: true,
  schemaText: "",
  schemaDiagnostics: [],
  eligible: true,
  eligibilityReason: "",
  onToggle: vi.fn(),
  onSchemaTextChange: vi.fn(),
  onCheckSchema: vi.fn(),
  onClear: vi.fn(),
};

describe("SchemaDrawer", () => {
  it("renders the Schema button when closed", () => {
    renderWithTooltip(<SchemaDrawer {...baseProps} open={false} />);

    expect(screen.getByText("Schema")).toBeInTheDocument();
  });

  it("renders the textarea when open", () => {
    renderWithTooltip(<SchemaDrawer {...baseProps} open={true} />);

    expect(screen.getByPlaceholderText(/paste or upload/i)).toBeInTheDocument();
  });

  it("renders the Check Schema button", () => {
    renderWithTooltip(<SchemaDrawer {...baseProps} />);

    expect(screen.getByRole("button", { name: "Check Schema" })).toBeInTheDocument();
  });

  it("renders Upload and Clear schema buttons", () => {
    renderWithTooltip(<SchemaDrawer {...baseProps} />);

    expect(screen.getByRole("button", { name: "Upload schema" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear schema" })).toBeInTheDocument();
  });

  it("shows schema diagnostics when present", () => {
    renderWithTooltip(
      <SchemaDrawer
        {...baseProps}
        schemaDiagnostics={[
          {
            code: "schema.type",
            message: "must be string at /name",
            position: { offset: 0, line: 1, column: 1 },
            reliability: "confirmed",
            repairState: "not-applicable",
            severity: "error",
          },
        ]}
      />,
    );

    expect(screen.getByText("must be string at /name")).toBeInTheDocument();
  });

  it("shows valid message when schema passes and text exists", () => {
    renderWithTooltip(<SchemaDrawer {...baseProps} schemaText='{"type":"object"}' />);

    expect(screen.getByText("JSON is valid against the schema.")).toBeInTheDocument();
  });

  it("disables Check Schema when not eligible", () => {
    renderWithTooltip(
      <SchemaDrawer
        {...baseProps}
        eligible={false}
        eligibilityReason="Requires valid JSON."
      />,
    );

    // There are 2 elements with role "button" and name "Check Schema"
    // (the inner disabled button and the DisabledReason wrapper).
    // The inner one has the HTML disabled attribute.
    const buttons = screen.getAllByRole("button", { name: "Check Schema" });
    const realButton = buttons.find((b) => b.hasAttribute("disabled"));
    expect(realButton).toBeDisabled();
  });

  it("calls onCheckSchema when Check Schema is clicked", () => {
    const onCheckSchema = vi.fn();

    renderWithTooltip(<SchemaDrawer {...baseProps} onCheckSchema={onCheckSchema} />);

    screen.getByRole("button", { name: "Check Schema" }).click();
    expect(onCheckSchema).toHaveBeenCalledOnce();
  });

  it("calls onToggle when close button is clicked", () => {
    const onToggle = vi.fn();

    renderWithTooltip(<SchemaDrawer {...baseProps} onToggle={onToggle} />);

    screen.getByRole("button", { name: "Close schema drawer" }).click();
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("calls onClear when clear button is clicked", () => {
    const onClear = vi.fn();

    renderWithTooltip(<SchemaDrawer {...baseProps} onClear={onClear} />);

    screen.getByRole("button", { name: "Clear schema" }).click();
    expect(onClear).toHaveBeenCalledOnce();
  });
});
