import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IconButton } from "../../../src/components/ui/IconButton";
import { TooltipProvider } from "../../../src/components/ui/Tooltip";

describe("IconButton", () => {
  it("renders with accessible label", () => {
    render(<IconButton icon={<span>X</span>} label="Clear" />);

    const button = screen.getByRole("button", { name: "Clear" });
    expect(button).toBeInTheDocument();
  });

  it("renders the icon inside the button", () => {
    render(<IconButton icon={<span data-testid="icon">X</span>} label="Clear" />);

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<IconButton icon={<span>X</span>} label="Clear" onClick={onClick} />);

    screen.getByRole("button", { name: "Clear" }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables the button", () => {
    render(<IconButton icon={<span>X</span>} label="Clear" disabled />);

    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("renders with a tooltip when wrapped in TooltipProvider", () => {
    render(
      <TooltipProvider>
        <IconButton icon={<span>X</span>} label="Clear" tooltip="Clear input" />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
});
