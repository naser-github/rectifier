import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Workspace } from "../../src/components/layout/Workspace";

describe("Workspace", () => {
  it("renders input, actions, and result sections in a grid", () => {
    render(
      <Workspace
        input={<div>Input content</div>}
        actions={<div>Action dock</div>}
        result={<div>Result panel</div>}
      />,
    );

    expect(screen.getByText("Input content")).toBeInTheDocument();
    expect(screen.getByText("Action dock")).toBeInTheDocument();
    expect(screen.getByText("Result panel")).toBeInTheDocument();
  });

  it("renders the main tag", () => {
    const { container } = render(
      <Workspace input={null} actions={null} result={<div>Only result</div>} />,
    );

    expect(container.querySelector("main")).toBeInTheDocument();
  });
});
