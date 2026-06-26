import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../../src/app/App";
import type {
  WorkerClient,
  WorkerResponseHandler,
} from "../../src/hooks/useWorkerClient";
import type { WorkerSourceRevision } from "../../src/domain/workerProtocol";

// ---------------------------------------------------------------------------
// Mock idb-keyval (used by useWorkspacePersistence)
// ---------------------------------------------------------------------------

beforeEach(() => {
  class MockResizeObserver {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    observe(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unobserve(): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    disconnect(): void {}
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

// ---------------------------------------------------------------------------
// Fake worker client
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fake worker client
// ---------------------------------------------------------------------------

const createFakeClient = (): WorkerClient & {
  readonly setSourceSpy: ReturnType<
    typeof vi.fn<(source: WorkerSourceRevision) => void>
  >;
  emitSourceValidated(response: Parameters<WorkerResponseHandler>[0]): void;
} => {
  let handler: WorkerResponseHandler = () => undefined;
  const setSourceSpy = vi.fn<(source: WorkerSourceRevision) => void>();

  return {
    setSourceSpy,
    analyzeRepair: vi.fn(() => "job-repair"),
    dispose: vi.fn(),
    setResponseHandler(nextHandler): void {
      handler = nextHandler;
    },
    validateResult: vi.fn(() => "job-validation"),
    setSource(source: WorkerSourceRevision): string {
      setSourceSpy(source);
      return "job-source";
    },
    emitSourceValidated(response): void {
      handler(response);
    },
  };
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("App", () => {
  it("renders the minimal Rectifier workspace sections", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByText("Input JSON")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });

  it("renders the input editor", () => {
    const client = createFakeClient();

    render(<App workerClient={client} />);

    expect(
      screen.getByRole("region", { name: /input json editor/i }),
    ).toBeInTheDocument();
  });

  it("shows the validation status tray with Upload and Clear controls", () => {
    render(<App workerClient={createFakeClient()} />);

    // InputPanel with Upload/Clear buttons
    expect(screen.getByRole("button", { name: "Upload JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear input" })).toBeInTheDocument();

    // Status tray shows checking state initially
    expect(screen.getByText("Checking JSON…")).toBeInTheDocument();
  });
});
