import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Radix Tooltip requires ResizeObserver
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

import { DisabledReason } from "../../../src/components/ui/DisabledReason";
import { TooltipProvider } from "../../../src/components/ui/Tooltip";

describe("DisabledReason", () => {
  it("renders children directly when reason is empty", () => {
    render(
      <DisabledReason reason="">
        <button>Enabled</button>
      </DisabledReason>,
    );

    const button = screen.getByRole("button", { name: "Enabled" });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("renders a focusable wrapper with aria-disabled when reason is provided", () => {
    render(
      <TooltipProvider>
        <DisabledReason reason="Paste JSON first.">
          <button disabled>Beautify</button>
        </DisabledReason>
      </TooltipProvider>,
    );

    // The wrapper span is the one with aria-disabled="true"
    const buttons = screen.getAllByRole("button", { name: "Beautify" });
    const wrapper = buttons.find((el) => el.getAttribute("aria-disabled") === "true");
    if (!wrapper) throw new Error("Expected wrapper element");
    expect(wrapper).toHaveAttribute("tabindex", "0");
  });

  it("renders the disabled child inside the wrapper", () => {
    render(
      <TooltipProvider>
        <DisabledReason reason="Needs valid JSON.">
          <button disabled>Minify</button>
        </DisabledReason>
      </TooltipProvider>,
    );

    const disabledButton = screen.getByText("Minify");
    expect(disabledButton).toBeInTheDocument();
  });

  it("shows the reason on keyboard focus of the wrapper", async () => {
    render(
      <TooltipProvider>
        <DisabledReason reason="Paste JSON first.">
          <button disabled>Upload</button>
        </DisabledReason>
      </TooltipProvider>,
    );

    // Find the wrapper by aria-disabled (there are 2 buttons with name "Upload")
    const buttons = screen.getAllByRole("button", { name: "Upload" });
    const wrapper = buttons.find((el) => el.getAttribute("aria-disabled") === "true");
    if (!wrapper) throw new Error("Expected wrapper element");
    expect(wrapper).toHaveAttribute("aria-disabled", "true");
    fireEvent.focus(wrapper);

    // Wait for the tooltip to appear (Radix has a 400ms delay)
    const tooltip = await screen.findByRole("tooltip", { name: "Paste JSON first." });
    expect(tooltip).toBeInTheDocument();
  });
});
