import "@testing-library/jest-dom/vitest";

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Toast } from "../../../src/components/ui/Toast";

describe("Toast", () => {
  it("renders the message", () => {
    vi.useFakeTimers();

    render(<Toast message="Copied!" onClose={vi.fn()} />);

    expect(screen.getByText("Copied!")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("has status role with polite announcement", () => {
    vi.useFakeTimers();

    render(<Toast message="Saved" onClose={vi.fn()} />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");

    vi.useRealTimers();
  });

  it("calls onClose after duration", () => {
    vi.useFakeTimers();

    const onClose = vi.fn();
    render(<Toast message="Temporary" duration={500} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(500 + 200); // duration + exit animation
    });
    expect(onClose).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
