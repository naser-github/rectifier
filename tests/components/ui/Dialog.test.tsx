import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dialog } from "../../../src/components/ui/Dialog";

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Dialog open={false} onClose={vi.fn()}>
        <p>Hidden content</p>
      </Dialog>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders content when open", () => {
    render(
      <Dialog open={true} onClose={vi.fn()}>
        <p>Dialog content</p>
      </Dialog>,
    );

    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Repair Preview">
        <p>Content</p>
      </Dialog>,
    );

    expect(screen.getByText("Repair Preview")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} actions={<button>Accept</button>}>
        <p>Content</p>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
  });

  it("has accessible dialog role and aria-modal", () => {
    render(
      <Dialog open={true} onClose={vi.fn()}>
        <p>Accessible</p>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();

    render(
      <Dialog open={true} onClose={onClose}>
        <p>Press Escape</p>
      </Dialog>,
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
