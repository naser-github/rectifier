import "@testing-library/jest-dom/vitest";

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../src/app/App";
import type { WorkerClient } from "../../src/hooks/useWorkerClient";
import type { WorkerResponse } from "../../src/domain/workerProtocol";

beforeEach(() => {
  class MockResizeObserver {
    observe(): void {
      /* noop */
    }
    unobserve(): void {
      /* noop */
    }
    disconnect(): void {
      /* noop */
    }
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock("idb-keyval", () => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

function createFakeClient(): WorkerClient & {
  readonly analyzeRepairSpy: ReturnType<typeof vi.fn<() => string>>;
  readonly convertSpy: ReturnType<typeof vi.fn<() => string>>;
  readonly formatSpy: ReturnType<typeof vi.fn<() => string>>;
  readonly validateSchemaSpy: ReturnType<typeof vi.fn<() => string>>;
  emitSourceValidated(response: WorkerResponse): void;
} {
  let handler: (response: WorkerResponse) => void = () => undefined;
  const analyzeRepairSpy = vi.fn(() => "job-repair");
  const convertSpy = vi.fn(() => "job-convert");
  const formatSpy = vi.fn(() => "job-format");
  const validateSchemaSpy = vi.fn(() => "job-schema");

  return {
    analyzeRepairSpy,
    convertSpy,
    formatSpy,
    validateSchemaSpy,
    setSource: vi.fn(() => "job-source"),
    analyzeRepair: analyzeRepairSpy,
    validateResult: vi.fn(() => "job-validation"),
    format: formatSpy,
    convert: convertSpy,
    validateSchema: validateSchemaSpy,
    dispose: vi.fn(),
    setResponseHandler(nextHandler) {
      handler = nextHandler;
    },
    emitSourceValidated(response) {
      handler(response);
    },
  };
}

function emitValidJson(client: ReturnType<typeof createFakeClient>): void {
  act(() => {
    client.emitSourceValidated({
      diagnostics: [],
      eligibility: {
        diagnosticCode: "valid-json",
        isEligible: false,
        reason: "valid-json",
      },
      id: "job-source",
      kind: "source-validated",
      revision: 1,
    });
  });
}

function emitJsonResult(client: ReturnType<typeof createFakeClient>): void {
  act(() => {
    client.emitSourceValidated({
      id: "job-format",
      kind: "format-complete",
      result: {
        action: "beautify",
        format: "json",
        revision: 1,
        text: '{"a":1}',
      },
      revision: 1,
    });
  });
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

function getNativeButton(name: string): HTMLButtonElement {
  const button = screen
    .getAllByRole("button", { name })
    .find(
      (element): element is HTMLButtonElement => element instanceof HTMLButtonElement,
    );

  if (!button) {
    throw new Error(`Expected native button named ${name}`);
  }

  return button;
}

function getKeyboardTarget(name: string): HTMLElement {
  const controls = screen.getAllByRole("button", { name });
  return (
    controls.find((element) => element.getAttribute("aria-disabled") === "true") ??
    controls[0] ??
    (() => {
      throw new Error(`Expected keyboard target named ${name}`);
    })()
  );
}

describe("Accessibility", () => {
  it("header has visible heading and logo area", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByText("Rectifier")).toBeInTheDocument();
    expect(screen.getByText("{ }")).toBeInTheDocument();
  });

  it("workspace sections have proper landmark roles", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByRole("heading", { name: "Actions" })).toBeInTheDocument();
  });

  it("validation status has an aria-label", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(
      screen.getByRole("region", { name: "Validation status" }),
    ).toBeInTheDocument();
  });

  it("icon buttons have accessible names", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByRole("button", { name: "Upload JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear input" })).toBeInTheDocument();
  });

  it("mobile tab list has accessible role and label", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByRole("tablist", { name: "Workspace tabs" })).toBeInTheDocument();
  });

  it("mobile input tab is selected by default", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByRole("tab", { name: "Input" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("has a privacy button outside main content", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByText("Your JSON stays in this browser")).toBeInTheDocument();
  });

  it("requires confirmation before clearing saved browser storage", async () => {
    const client = createFakeClient();
    render(<App workerClient={client} />);

    act(() => {
      fireEvent.click(
        screen.getByRole("button", { name: /your json stays in this browser/i }),
      );
    });
    await act(async () => {
      fireEvent.click(
        await screen.findByRole("button", { name: "Clear saved workspace" }),
      );
    });

    expect(screen.getByRole("button", { name: "Confirm clear" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("keeps all central actions keyboard reachable with icons and labels", () => {
    const client = createFakeClient();
    render(<App workerClient={client} />);
    emitValidJson(client);

    const beautify = getKeyboardTarget("Beautify");
    const minify = getKeyboardTarget("Minify");
    const convert = getKeyboardTarget("Convert");
    const repair = getKeyboardTarget("Repair JSON");

    for (const button of [beautify, minify, convert, repair]) {
      button.focus();
      expect(button).toHaveFocus();
    }

    expect(getNativeButton("Beautify").querySelector("svg")).toBeInTheDocument();
    expect(getNativeButton("Minify").querySelector("svg")).toBeInTheDocument();
    expect(getNativeButton("Convert").querySelector("svg")).toBeInTheDocument();
    expect(getNativeButton("Repair JSON").querySelector("svg")).toBeInTheDocument();
  });

  it("keeps result view controls keyboard reachable after a JSON result exists", () => {
    const client = createFakeClient();
    render(<App workerClient={client} />);
    emitJsonResult(client);

    for (const name of ["code view", "tree view", "object view"]) {
      const button = screen.getByRole("button", { name });
      button.focus();
      expect(button).toHaveFocus();
    }
  });

  it.each([
    [390, 844],
    [768, 1024],
    [1440, 900],
  ])("keeps core workspace controls reachable at %sx%s", (width, height) => {
    setViewport(width, height);
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByRole("tablist", { name: "Workspace tabs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear input" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schema" })).toBeInTheDocument();
  });

  it("does not send editor content through browser network APIs during UI actions", () => {
    const fetchSpy = vi.fn();
    const sendBeaconSpy = vi.fn();
    const openSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconSpy,
    });
    vi.stubGlobal(
      "XMLHttpRequest",
      class MockXMLHttpRequest {
        open(): void {
          openSpy();
        }
      },
    );

    const client = createFakeClient();
    render(<App workerClient={client} />);
    emitValidJson(client);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Schema" }));
    });
    fireEvent.change(screen.getByPlaceholderText("Paste or upload a JSON Schema..."), {
      target: { value: '{"type":"object"}' },
    });
    fireEvent.click(getKeyboardTarget("Check Schema"));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(sendBeaconSpy).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
