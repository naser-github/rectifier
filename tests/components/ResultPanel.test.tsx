import "@testing-library/jest-dom/vitest";

import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResultPanel } from "../../src/components/result/ResultPanel";
import { TooltipProvider } from "../../src/components/ui/Tooltip";
import type { ResultDocument } from "../../src/domain/result";

vi.mock("../../src/components/editor/ResultEditor", () => ({
  ResultEditor({
    value,
    language,
    readOnly,
    onChange,
  }: {
    readonly value: string;
    readonly language: string;
    readonly readOnly?: boolean;
    readonly onChange?: (text: string) => void;
  }) {
    return (
      <textarea
        aria-label={`result editor ${language}`}
        value={value}
        readOnly={readOnly}
        onChange={(event) => {
          onChange?.(event.currentTarget.value);
        }}
      />
    );
  },
}));

function Wrapper({ children }: { readonly children: ReactNode }): ReactNode {
  return <TooltipProvider>{children}</TooltipProvider>;
}

function r(ui: ReactNode) {
  return render(ui, { wrapper: Wrapper });
}

const jsonResult: ResultDocument = {
  action: "beautify",
  format: "json",
  revision: 1,
  text: '{"a":1,"b":2}',
};

const yamlResult: ResultDocument = {
  action: "convert-yaml",
  format: "yaml",
  revision: 1,
  text: "a: 1\nb: 2\n",
};

let clipboardWriteText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

describe("ResultPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clipboardWriteText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardWriteText,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows empty state when no result exists", () => {
    render(<ResultPanel result={null} />);

    expect(screen.getByText("No result yet")).toBeInTheDocument();
  });

  it("shows the result action as status", () => {
    r(<ResultPanel result={jsonResult} />);

    expect(screen.getByText("beautify")).toBeInTheDocument();
  });

  it("renders view mode buttons", () => {
    r(<ResultPanel result={jsonResult} />);

    expect(screen.getByRole("button", { name: "code view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tree view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "object view" })).toBeInTheDocument();
  });

  it("renders Copy and Download buttons", () => {
    r(<ResultPanel result={jsonResult} />);

    expect(screen.getByRole("button", { name: "Copy result" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download result" })).toBeInTheDocument();
  });

  it("disables Tree and Object views for non-JSON formats", () => {
    r(<ResultPanel result={yamlResult} />);

    expect(screen.getByRole("button", { name: "tree view" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "object view" })).toBeDisabled();
  });

  it("Copy button is present and clickable", () => {
    r(<ResultPanel result={jsonResult} />);

    const copyBtn = screen.getByRole("button", { name: "Copy result" });
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).not.toBeDisabled();
  });

  it("Download button is present and clickable", () => {
    r(<ResultPanel result={jsonResult} />);

    const dlBtn = screen.getByRole("button", { name: "Download result" });
    expect(dlBtn).toBeInTheDocument();
    expect(dlBtn).not.toBeDisabled();
  });

  it("copies exact current result text without exposing content in feedback", () => {
    r(<ResultPanel result={jsonResult} />);

    act(() => {
      screen.getByRole("button", { name: "Copy result" }).click();
    });

    expect(clipboardWriteText).toHaveBeenCalledWith(jsonResult.text);
    expect(screen.getByRole("status")).toHaveTextContent("Copied result");
  });

  it("downloads exact current result text with matching extension and revokes URL", () => {
    const click = vi.fn();
    const blobParts: BlobPart[] = [];
    const anchors: HTMLAnchorElement[] = [];
    function MockBlob(this: Blob, parts: BlobPart[]): void {
      blobParts.push(...parts);
    }
    vi.stubGlobal("Blob", MockBlob);
    const createElement = vi.spyOn(document, "createElement");
    createElement.mockImplementation((tagName: string) => {
      const element = document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
      if (tagName === "a") {
        if (!(element instanceof HTMLAnchorElement)) {
          throw new Error("expected anchor");
        }
        Object.defineProperty(element, "click", { value: click });
        anchors.push(element);
      }
      return element;
    });
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:result");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
      // no-op in jsdom
    });

    r(<ResultPanel result={yamlResult} />);

    screen.getByRole("button", { name: "Download result" }).click();

    const blob = createObjectURL.mock.calls[0]?.[0];
    if (!(blob instanceof Blob)) {
      throw new Error("expected Blob");
    }
    expect(blobParts).toEqual([yamlResult.text]);
    expect(anchors[0]?.download).toBe("result.yaml");
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:result");
  });

  it("sends edited JSON result text for validation", () => {
    const onJsonResultEdit = vi.fn();
    r(<ResultPanel result={jsonResult} onJsonResultEdit={onJsonResultEdit} />);

    fireEvent.change(screen.getByLabelText("result editor json"), {
      target: { value: '{"a":2}' },
    });

    expect(onJsonResultEdit).toHaveBeenCalledWith({
      ...jsonResult,
      text: '{"a":2}',
    });
  });

  it("does not edit converted output", () => {
    const onJsonResultEdit = vi.fn();
    r(<ResultPanel result={yamlResult} onJsonResultEdit={onJsonResultEdit} />);

    expect(screen.getByLabelText("result editor text")).toHaveAttribute("readonly");
  });
});
