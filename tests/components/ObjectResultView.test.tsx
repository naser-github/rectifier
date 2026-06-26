import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ObjectResultView } from "../../src/components/result/ObjectResultView";

describe("ObjectResultView", () => {
  it("renders the scroll container with correct total height", () => {
    const { container } = render(<ObjectResultView json='{"name":"John"}' />);

    const inner = container.querySelector("[style]");
    expect(inner).toBeInTheDocument();
    expect(inner?.getAttribute("style")).toContain("64px");
  });

  it("renders with nested objects", () => {
    const { container } = render(<ObjectResultView json='{"a":{"b":1}}' />);

    const inner = container.querySelector("[style]");
    expect(inner).toBeInTheDocument();
    expect(inner?.getAttribute("style")).toContain("96px");
  });

  it("handles deeply nested structures without crashing", () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
    const { container } = render(<ObjectResultView json={JSON.stringify(deep)} />);

    const inner = container.querySelector("[style]");
    expect(inner).toBeInTheDocument();
    // 8 rows × 32px = 256px
    expect(inner?.getAttribute("style")).toContain("256");
  });

  it("renders large arrays efficiently", () => {
    const large = Array.from({ length: 50 }, (_, i) => ({ index: i }));
    const { container } = render(<ObjectResultView json={JSON.stringify(large)} />);

    const inner = container.querySelector("[style]");
    expect(inner).toBeInTheDocument();
    expect(inner?.getAttribute("style")).toContain("px");
  });

  it("collapses and expands object rows by click", () => {
    render(<ObjectResultView json='{"a":{"b":1}}' />);

    const collapseButtons = screen.getAllByRole("button", { name: "Collapse" });
    const firstCollapseButton = collapseButtons[0];
    if (!firstCollapseButton) throw new Error("expected collapse button");

    fireEvent.click(firstCollapseButton);
    expect(screen.getByText(/\{ 1 item }/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getAllByRole("button", { name: "Collapse" }).length).toBeGreaterThan(
      0,
    );
  });

  it("supports keyboard activation for collapse", () => {
    render(<ObjectResultView json='{"a":1}' />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Collapse" }), {
      key: " ",
    });

    expect(screen.getByText(/\{ 1 item }/)).toBeInTheDocument();
  });
});
