import "@testing-library/jest-dom/vitest";

import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "../../src/app/App";
import type {
  WorkerClient,
  WorkerResponseHandler,
} from "../../src/hooks/useWorkerClient";
import type { WorkerSourceRevision } from "../../src/domain/workerProtocol";

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
    setSource(source: WorkerSourceRevision): string {
      setSourceSpy(source);
      return "job-source";
    },
    emitSourceValidated(response): void {
      handler(response);
    },
  };
};

describe("App", () => {
  it("renders the minimal Rectifier workspace sections", () => {
    render(<App workerClient={createFakeClient()} />);

    expect(screen.getByRole("heading", { name: "Input JSON" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Result" })).toBeInTheDocument();
  });

  it("renders the real input editor and sends the initial source for validation", () => {
    const client = createFakeClient();

    render(<App workerClient={client} />);

    expect(
      screen.getByRole("region", { name: /input json editor/i }),
    ).toBeInTheDocument();
    expect(client.setSourceSpy).toHaveBeenCalledOnce();
    const firstSource = client.setSourceSpy.mock.calls[0]?.[0];
    expect(firstSource?.revision).toBe(1);
    expect(firstSource?.text).toContain('"name": "Rectifier"');
  });

  it("shows worker diagnostics in the status tray", () => {
    const client = createFakeClient();

    render(<App workerClient={client} />);

    act(() => {
      client.emitSourceValidated({
        diagnostics: [
          {
            code: "json.missing-comma",
            message: "Missing comma.",
            position: { column: 10, line: 2, offset: 9 },
            reliability: "confirmed",
            repairState: "eligible",
            severity: "error",
          },
        ],
        eligibility: {
          diagnosticCode: "json.missing-comma",
          isEligible: true,
          ruleId: "missing-comma",
        },
        id: "job-source",
        kind: "source-validated",
        revision: 1,
      });
    });

    expect(screen.getByText("Missing comma.")).toBeInTheDocument();
    expect(screen.getByText(/line\s*2/i)).toBeInTheDocument();
  });
});
