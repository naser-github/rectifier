import "@testing-library/jest-dom/vitest";

import { act, render, screen, waitFor } from "@testing-library/react";
import { useReducer, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { RepairAnalysisResult, RepairCandidate } from "../../src/domain/repair";
import type { ResultDocument } from "../../src/domain/result";
import {
  INITIAL_WORKSPACE_STATE,
  type WorkspaceState,
} from "../../src/domain/workspace";
import { useRepairFlow } from "../../src/hooks/useRepairFlow";
import type { WorkerResponseHandler } from "../../src/hooks/useWorkerClient";
import { workspaceReducer } from "../../src/state/workspaceReducer";
import type { WorkerSourceRevision } from "../../src/domain/workerProtocol";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const safeCandidate: RepairCandidate = {
  id: "candidate-1",
  summary: "Insert missing comma.",
  edits: [{ startOffset: 5, endOffset: 5, replacement: ",", type: "insert" }],
  repairedText: '{"a":1,"b":2}',
  verification: { result: "verified", dataPreserved: true, exactSourcePreserved: true },
};

const safeAnalysis: RepairAnalysisResult = {
  kind: "safe",
  candidate: safeCandidate,
};

const ambiguousAnalysis: RepairAnalysisResult = {
  kind: "ambiguous",
  choices: [
    { ...safeCandidate, id: "choice-1", summary: "Option A", repairedText: '{"a":1}' },
    { ...safeCandidate, id: "choice-2", summary: "Option B", repairedText: '{"b":2}' },
  ],
  manualGuidance: "Choose the correct structure.",
};

// ---------------------------------------------------------------------------
// Fake client
// ---------------------------------------------------------------------------

const createFakeClient = () => {
  let handler: WorkerResponseHandler = () => undefined;

  return {
    analyzeRepair: vi.fn<(source: WorkerSourceRevision) => string>(
      () => "job-analysis",
    ),
    validateResult: vi.fn<(result: ResultDocument) => string>(() => "job-validation"),
    setSource: vi.fn(() => "job-source"),
    dispose: vi.fn(),
    setResponseHandler: vi.fn((nextHandler: WorkerResponseHandler): void => {
      handler = nextHandler;
    }),
    emitResponse(response: Record<string, unknown>): void {
      handler(response as never);
    },
  };
};

type FakeClient = ReturnType<typeof createFakeClient>;

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

interface TestHarnessProps {
  readonly client: FakeClient;
  readonly initialState: WorkspaceState;
}

function TestHarness({ client, initialState }: TestHarnessProps): ReactNode {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const onEditManually = vi.fn();
  const api = useRepairFlow(state, client, dispatch, onEditManually);

  return (
    <div>
      <span data-testid="repair-state">{state.repairState}</span>
      <span data-testid="has-result">{state.result !== null ? "yes" : "no"}</span>
      <span data-testid="result-error">{state.resultError ?? ""}</span>

      <button
        onClick={() => {
          api.startRepairAnalysis();
        }}
      >
        Analyze
      </button>
      <button
        onClick={() => {
          api.acceptRepair();
        }}
      >
        Accept
      </button>
      <button
        onClick={() => {
          api.rejectRepair();
        }}
      >
        Reject
      </button>
      <button
        onClick={() => {
          dispatch({ type: "SET_REPAIR_VALIDATION", valid: true, id: "test" });
        }}
      >
        ValidResult
      </button>
      <button
        onClick={() => {
          dispatch({ type: "SET_REPAIR_VALIDATION", valid: false, id: "test" });
        }}
      >
        InvalidResult
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "SET_INPUT",
            text: '{"edited":true}',
            isUpload: true,
          });
        }}
      >
        EditInput
      </button>
    </div>
  );
}

function AmbiguousHarness({ client, initialState }: TestHarnessProps): ReactNode {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const onEditManually = vi.fn();
  const api = useRepairFlow(state, client, dispatch, onEditManually);

  return (
    <div>
      <span data-testid="repair-state">{state.repairState}</span>
      <span data-testid="has-result">{state.result !== null ? "yes" : "no"}</span>
      <span data-testid="result-error">{state.resultError ?? ""}</span>

      <button
        onClick={() => {
          api.applyAmbiguousChoice(safeCandidate);
        }}
      >
        ApplyChoice
      </button>
      <button
        onClick={() => {
          dispatch({ type: "SET_REPAIR_VALIDATION", valid: true, id: "test" });
        }}
      >
        ValidResult
      </button>
      <button
        onClick={() => {
          dispatch({ type: "SET_REPAIR_VALIDATION", valid: false, id: "test" });
        }}
      >
        InvalidResult
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "SET_INPUT",
            text: '{"edited":true}',
            isUpload: true,
          });
        }}
      >
        EditInput
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("useRepairFlow — acceptRepair", () => {
  it("acceptRepair calls client.validateResult", () => {
    const client = createFakeClient();

    render(
      <TestHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: safeAnalysis,
        }}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: "Accept" }).click();
    });
    expect(client.validateResult).toHaveBeenCalled();
  });

  it("creates a result when validation succeeds (valid=true)", async () => {
    const client = createFakeClient();

    render(
      <TestHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: safeAnalysis,
        }}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: "Accept" }).click();
      screen.getByRole("button", { name: "ValidResult" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("has-result").textContent).toBe("yes");
    });
    expect(screen.getByTestId("repair-state").textContent).toBe("idle");
  });

  it("does not create a result when validation fails (valid=false)", async () => {
    const client = createFakeClient();

    render(
      <TestHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: safeAnalysis,
        }}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: "Accept" }).click();
      screen.getByRole("button", { name: "InvalidResult" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("has-result").textContent).toBe("no");
    });
    expect(screen.getByTestId("repair-state").textContent).toBe("idle");
    expect(screen.getByTestId("result-error").textContent).toContain("Repair produced");
  });
});

describe("useRepairFlow — applyAmbiguousChoice", () => {
  it("applyAmbiguousChoice calls client.validateResult", () => {
    const client = createFakeClient();

    render(
      <AmbiguousHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: ambiguousAnalysis,
        }}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: "ApplyChoice" }).click();
    });
    expect(client.validateResult).toHaveBeenCalled();
  });

  it("creates a result when ambiguous validation succeeds", async () => {
    const client = createFakeClient();

    render(
      <AmbiguousHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: ambiguousAnalysis,
        }}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: "ApplyChoice" }).click();
      screen.getByRole("button", { name: "ValidResult" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("has-result").textContent).toBe("yes");
    });
  });

  it("does not create a result when ambiguous validation fails", async () => {
    const client = createFakeClient();

    render(
      <AmbiguousHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: ambiguousAnalysis,
        }}
      />,
    );

    act(() => {
      screen.getByRole("button", { name: "ApplyChoice" }).click();
      screen.getByRole("button", { name: "InvalidResult" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("has-result").textContent).toBe("no");
    });
    expect(screen.getByTestId("result-error").textContent).toContain("Repair produced");
  });
});

describe("useRepairFlow — stale guard", () => {
  it("acceptRepair does nothing after a revision change (stale Accept)", async () => {
    const client = createFakeClient();

    render(
      <TestHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: safeAnalysis,
        }}
      />,
    );

    // User edits input — this bumps revision and clears analysis/repair state
    act(() => {
      screen.getByRole("button", { name: "EditInput" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("repair-state").textContent).toBe("idle");
    });

    // Now click Accept — should do nothing because analysis is gone
    act(() => {
      screen.getByRole("button", { name: "Accept" }).click();
    });

    // validateResult should NOT have been called
    expect(client.validateResult).not.toHaveBeenCalled();
    expect(screen.getByTestId("has-result").textContent).toBe("no");
  });

  it("ambiguous Apply does nothing after a revision change (stale Apply)", async () => {
    const client = createFakeClient();

    render(
      <AmbiguousHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: ambiguousAnalysis,
        }}
      />,
    );

    // Change revision — clears analysis/repair state
    act(() => {
      screen.getByRole("button", { name: "EditInput" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("repair-state").textContent).toBe("idle");
    });

    // Apply — should do nothing
    act(() => {
      screen.getByRole("button", { name: "ApplyChoice" }).click();
    });

    expect(client.validateResult).not.toHaveBeenCalled();
    expect(screen.getByTestId("has-result").textContent).toBe("no");
  });

  it("validation round-trip refuses after revision change", async () => {
    const client = createFakeClient();

    render(
      <TestHarness
        client={client}
        initialState={{
          ...INITIAL_WORKSPACE_STATE,
          input: '{"broken"',
          revision: 3,
          repairState: "ready" as const,
          repairAnalysis: safeAnalysis,
        }}
      />,
    );

    // Accept — sets pendingValidationRef
    act(() => {
      screen.getByRole("button", { name: "Accept" }).click();
    });
    expect(client.validateResult).toHaveBeenCalled();

    // User edits input during the round-trip — clears pendingValidationRef
    act(() => {
      screen.getByRole("button", { name: "EditInput" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("repair-state").textContent).toBe("idle");
    });

    // Validation response arrives — should be ignored because pending was cleared
    act(() => {
      screen.getByRole("button", { name: "ValidResult" }).click();
    });

    expect(screen.getByTestId("has-result").textContent).toBe("no");
  });

  it("SET_REPAIR_ANALYSIS with old revision is rejected by reducer", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, revision: 5 },
      { type: "SET_REPAIR_ANALYSIS", analysis: safeAnalysis, revision: 3 },
    );

    expect(state.repairAnalysis).toBeNull();
    expect(state.repairState).toBe("idle");
  });
});
