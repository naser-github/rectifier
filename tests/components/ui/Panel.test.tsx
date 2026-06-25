import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Panel } from "../../../src/components/ui/Panel";

describe("Panel", () => {
  it("renders children", () => {
    render(
      <Panel>
        <p>Panel content</p>
      </Panel>,
    );

    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("renders title when provided", () => {
    render(
      <Panel title="Input JSON">
        <p>Content</p>
      </Panel>,
    );

    expect(screen.getByText("Input JSON")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <Panel title="Actions" actions={<button>Upload</button>}>
        <p>Content</p>
      </Panel>,
    );

    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
  });

  it("does not render header when title and actions are absent", () => {
    const { container } = render(
      <Panel>
        <p>Plain</p>
      </Panel>,
    );

    // Should not have a header div
    expect(container.querySelector(".border-b")).toBeNull();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Panel className="custom-panel">
        <p>Styled</p>
      </Panel>,
    );

    expect(container.firstChild).toHaveClass("custom-panel");
  });
});
