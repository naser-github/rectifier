import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tooltip, TooltipProvider } from "../../../src/components/ui/Tooltip";

describe("Tooltip", () => {
  it("renders the trigger children when wrapped in provider", () => {
    render(
      <TooltipProvider>
        <Tooltip content="Explanatory text">
          <button>Hover me</button>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });

  it("renders children without provider when content is empty", () => {
    render(
      <Tooltip content="">
        <span>No tooltip</span>
      </Tooltip>,
    );

    expect(screen.getByText("No tooltip")).toBeInTheDocument();
  });
});
