import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TreeResultView } from "../../src/components/result/TreeResultView";

describe("TreeResultView", () => {
  it("renders the scroll container with correct total height", () => {
    const { container } = render(<TreeResultView json='{"a":1,"b":2}' />);

    const inner = container.querySelector("[style]");
    expect(inner).toBeInTheDocument();
    expect(inner?.getAttribute("style")).toContain("72px");
  });

  it("renders collapsed items count", () => {
    const { container } = render(<TreeResultView json='{"a":1}' />);

    const inner = container.querySelector("[style]");
    // Root row "Object(1 items)" — collapsed state with count
    const style = inner?.getAttribute("style") ?? "";
    expect(style).toContain("48"); // 2 rows × 24px
  });

  it("renders the tree without crashing for large arrays", () => {
    const largeArray = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const { container } = render(<TreeResultView json={JSON.stringify(largeArray)} />);

    const inner = container.querySelector("[style]");
    expect(inner).toBeInTheDocument();
  });

  it("collapses and expands rows by click", () => {
    render(<TreeResultView json='{"a":{"b":1}}' />);

    const collapseButtons = screen.getAllByRole("button", { name: "Collapse" });
    const firstCollapseButton = collapseButtons[0];
    if (!firstCollapseButton) throw new Error("expected collapse button");

    fireEvent.click(firstCollapseButton);
    expect(screen.getByText(/\{...}/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(screen.getAllByRole("button", { name: "Collapse" }).length).toBeGreaterThan(
      0,
    );
  });

  it("supports keyboard activation for collapse", () => {
    render(<TreeResultView json="[1,2]" />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Collapse" }), {
      key: "Enter",
    });

    expect(screen.getByText(/\[...]/)).toBeInTheDocument();
  });
});
