import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RepairChoiceDialog } from "../../src/components/errors/RepairChoiceDialog";
import { RepairManualGuidance } from "../../src/components/errors/RepairManualGuidance";
import { RepairPreviewDialog } from "../../src/components/errors/RepairPreviewDialog";
import type { RepairCandidate } from "../../src/domain/repair";
import { INITIAL_WORKSPACE_STATE } from "../../src/domain/workspace";
import { workspaceReducer } from "../../src/state/workspaceReducer";

// ---------------------------------------------------------------------------
// ResizeObserver stub (Radix Dialog/Portal needs it)
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const safeCandidate: RepairCandidate = {
  id: "candidate-1",
  summary: "Insert one missing comma between name and value.",
  edits: [
    {
      startOffset: 18,
      endOffset: 18,
      replacement: ",",
      type: "insert",
    },
  ],
  repairedText: '{"name":"John","active":true}',
  verification: {
    result: "verified",
    dataPreserved: true,
    exactSourcePreserved: true,
  },
};

// ---------------------------------------------------------------------------
// RepairPreviewDialog
// ---------------------------------------------------------------------------

describe("RepairPreviewDialog", () => {
  it("renders the repair summary", () => {
    render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={true}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Insert one missing comma between name and value."),
    ).toBeInTheDocument();
  });

  it("renders the repaired JSON", () => {
    render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={true}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText('{"name":"John","active":true}')).toBeInTheDocument();
  });

  it("renders syntax edit descriptions", () => {
    render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={true}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText("insert")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText(",")).toBeInTheDocument();
  });

  it("renders Accept and Reject buttons", () => {
    render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={true}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={false}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("calls onAccept when Accept is clicked", () => {
    const onAccept = vi.fn();

    render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={true}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    screen.getByRole("button", { name: "Accept" }).click();
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("calls onReject when Reject is clicked", () => {
    const onReject = vi.fn();

    render(
      <RepairPreviewDialog
        candidate={safeCandidate}
        open={true}
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    screen.getByRole("button", { name: "Reject" }).click();
    expect(onReject).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// RepairChoiceDialog
// ---------------------------------------------------------------------------

const ambiguousChoices: readonly RepairCandidate[] = [
  {
    ...safeCandidate,
    id: "choice-1",
    summary: "Treat values as array items.",
    repairedText: '{"values":[1,2,3]}',
  },
  {
    ...safeCandidate,
    id: "choice-2",
    summary: "Treat values as separate properties.",
    repairedText: '{"a":1,"b":2,"c":3}',
  },
];

describe("RepairChoiceDialog", () => {
  it("renders the ambiguous guidance message", () => {
    render(
      <RepairChoiceDialog
        choices={ambiguousChoices}
        manualGuidance="Choose the correct structure."
        open={true}
        onApply={vi.fn()}
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/cannot safely choose/i)).toBeInTheDocument();
  });

  it("renders each candidate as a selectable card", () => {
    render(
      <RepairChoiceDialog
        choices={ambiguousChoices}
        manualGuidance=""
        open={true}
        onApply={vi.fn()}
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Treat values as array items.")).toBeInTheDocument();
    expect(
      screen.getByText("Treat values as separate properties."),
    ).toBeInTheDocument();
  });

  it("disables Apply until a choice is selected", () => {
    render(
      <RepairChoiceDialog
        choices={ambiguousChoices}
        manualGuidance=""
        open={true}
        onApply={vi.fn()}
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Apply selected fix" })).toBeDisabled();
  });

  it("renders Edit manually button", () => {
    render(
      <RepairChoiceDialog
        choices={ambiguousChoices}
        manualGuidance=""
        open={true}
        onApply={vi.fn()}
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit manually" })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <RepairChoiceDialog
        choices={ambiguousChoices}
        manualGuidance=""
        open={false}
        onApply={vi.fn()}
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});

// ---------------------------------------------------------------------------
// RepairManualGuidance
// ---------------------------------------------------------------------------

describe("RepairManualGuidance", () => {
  it("renders the guidance text", () => {
    render(
      <RepairManualGuidance
        open={true}
        guidance="Edit the JSON manually."
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Edit the JSON manually.")).toBeInTheDocument();
  });

  it("renders Edit manually button", () => {
    render(
      <RepairManualGuidance
        open={true}
        guidance="Fix the syntax."
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit manually" })).toBeInTheDocument();
  });

  it("calls onEditManually when button clicked", () => {
    const onEdit = vi.fn();

    render(
      <RepairManualGuidance
        open={true}
        guidance="Manual edit needed."
        onEditManually={onEdit}
        onClose={vi.fn()}
      />,
    );

    screen.getByRole("button", { name: "Edit manually" }).click();
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <RepairManualGuidance
        open={false}
        guidance="Fix it."
        onEditManually={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Reducer: repair state transitions
// ---------------------------------------------------------------------------

describe("workspaceReducer — repair actions", () => {
  it("SET_ANALYZING sets repairState to analyzing and clears previous analysis", () => {
    const state = workspaceReducer(
      {
        ...INITIAL_WORKSPACE_STATE,
        repairAnalysis: {
          kind: "manual",
          guidance: "old",
          reason: "unsupported-syntax",
        },
      },
      { type: "SET_ANALYZING" },
    );

    expect(state.repairState).toBe("analyzing");
    expect(state.repairAnalysis).toBeNull();
  });

  it("SET_REPAIR_ACCEPTED sets repairState to accepted", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, repairState: "ready" },
      { type: "SET_REPAIR_ACCEPTED" },
    );

    expect(state.repairState).toBe("accepted");
  });

  it("CLEAR_REPAIR resets repair state to idle", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, repairState: "ready" },
      { type: "CLEAR_REPAIR" },
    );

    expect(state.repairState).toBe("idle");
    expect(state.repairAnalysis).toBeNull();
  });

  it("SET_INPUT clears repair state", () => {
    const state = workspaceReducer(
      {
        ...INITIAL_WORKSPACE_STATE,
        repairState: "ready",
        repairAnalysis: {
          kind: "manual",
          guidance: "test",
          reason: "unsupported-syntax",
        },
      },
      { type: "SET_INPUT", text: '{"new":true}', isUpload: true },
    );

    expect(state.repairState).toBe("idle");
    expect(state.repairAnalysis).toBeNull();
  });

  it("CLEAR_INPUT clears repair state", () => {
    const state = workspaceReducer(
      {
        ...INITIAL_WORKSPACE_STATE,
        repairState: "ready",
      },
      { type: "CLEAR_INPUT" },
    );

    expect(state.repairState).toBe("idle");
  });

  it("SET_REPAIR_ANALYSIS rejects stale revision", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, revision: 5 },
      {
        type: "SET_REPAIR_ANALYSIS",
        analysis: { kind: "manual", guidance: "stale", reason: "unsupported-syntax" },
        revision: 3, // < current revision (5)
      },
    );

    expect(state.repairState).toBe("idle");
    expect(state.repairAnalysis).toBeNull();
  });

  it("SET_RESULT_ERROR stores the error message", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_RESULT_ERROR",
      error: "Validation failed.",
    });

    expect(state.resultError).toBe("Validation failed.");
  });

  it("SET_VALIDATING transitions from ready to validating", () => {
    const state = workspaceReducer(
      { ...INITIAL_WORKSPACE_STATE, repairState: "ready" },
      { type: "SET_VALIDATING" },
    );

    expect(state.validationState).toBe("validating");
  });

  it("SET_REPAIR_VALIDATION stores the validation outcome", () => {
    const state = workspaceReducer(INITIAL_WORKSPACE_STATE, {
      type: "SET_REPAIR_VALIDATION",
      valid: true,
      id: "job-5",
    });

    expect(state.repairValidation).toEqual({ valid: true, id: "job-5" });
  });

  it("CLEAR_REPAIR clears repairValidation", () => {
    const state = workspaceReducer(
      {
        ...INITIAL_WORKSPACE_STATE,
        repairValidation: { valid: true, id: "job-5" },
      },
      { type: "CLEAR_REPAIR" },
    );

    expect(state.repairValidation).toBeNull();
  });

  it("CLEAR_INPUT clears repairValidation", () => {
    const state = workspaceReducer(
      {
        ...INITIAL_WORKSPACE_STATE,
        repairValidation: { valid: true, id: "job-5" },
      },
      { type: "CLEAR_INPUT" },
    );

    expect(state.repairValidation).toBeNull();
  });
});
