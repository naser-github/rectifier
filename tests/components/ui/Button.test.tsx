import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../../../src/components/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Beautify</Button>);
    expect(screen.getByRole("button", { name: "Beautify" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    screen.getByRole("button", { name: "Click" }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("applies the default secondary variant", () => {
    render(<Button>Default</Button>);
    const button = screen.getByRole("button", { name: "Default" });

    expect(button.className).toContain("border-line");
  });

  it("applies the primary variant", () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole("button", { name: "Primary" });

    expect(button.className).toContain("bg-red-accent");
  });

  it("applies the danger variant", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button", { name: "Danger" });

    expect(button.className).toContain("text-red-accent");
  });

  it("accepts a custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button", { name: "Custom" })).toHaveClass("custom-class");
  });
});
