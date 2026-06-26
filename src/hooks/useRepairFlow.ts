import { useCallback, useEffect, useRef } from "react";
import type { RepairCandidate } from "../domain/repair";
import type { WorkspaceAction, WorkspaceState } from "../domain/workspace";
import type { WorkerClient } from "./useWorkerClient";

export interface RepairFlowAPI {
  readonly showSafePreview: boolean;
  readonly safeCandidate: RepairCandidate | null;
  readonly showAmbiguousChoices: boolean;
  readonly ambiguousChoices: readonly RepairCandidate[];
  readonly manualGuidance: string | null;
  readonly showManualGuidance: boolean;
  readonly analyzing: boolean;
  readonly repairError: string | null;
  readonly startRepairAnalysis: () => void;
  readonly acceptRepair: () => void;
  readonly applyAmbiguousChoice: (candidate: RepairCandidate) => void;
  readonly rejectRepair: () => void;
  readonly editManually: () => void;
}

type EditManuallyCallback = () => void;

/**
 * Manages the repair-analysis flow from user click through dialog to result.
 *
 * Flow:
 *   startRepairAnalysis → worker analyzes → SET_REPAIR_ANALYSIS → dialog shown
 *   acceptRepair/applyAmbiguousChoice → client.validateResult() → SET_REPAIR_VALIDATION
 *   → if valid: SET_RESULT + CLEAR_REPAIR
 *   → if invalid: SET_RESULT_ERROR + CLEAR_REPAIR
 *
 * Stale guards:
 *   1. Auto-closes dialogs when input revision changes.
 *   2. acceptRepair/applyAmbiguousChoice refuse if revision is stale.
 *   3. Post-validation check: refuses if revision changed during round-trip.
 */
export function useRepairFlow(
  state: WorkspaceState,
  client: WorkerClient,
  dispatch: React.Dispatch<WorkspaceAction>,
  onEditManually?: EditManuallyCallback,
): RepairFlowAPI {
  const lastRevisionRef = useRef(state.revision);
  const analysisRevisionRef = useRef<number | null>(null);
  const pendingValidationRef = useRef<{
    readonly candidate: RepairCandidate;
    readonly analysisRevision: number;
  } | null>(null);

  // Track the revision at which the current repair analysis was received
  useEffect(() => {
    if (state.repairState === "ready" && state.repairAnalysis) {
      analysisRevisionRef.current = state.revision;
    }
    if (state.repairState === "idle") {
      analysisRevisionRef.current = null;
    }
  }, [state.repairState, state.repairAnalysis, state.revision]);

  // Guard 1: auto-close dialogs when input revision changes
  useEffect(() => {
    if (state.revision !== lastRevisionRef.current) {
      lastRevisionRef.current = state.revision;
      if (state.repairState !== "idle") {
        dispatch({ type: "CLEAR_REPAIR" });
      }
      pendingValidationRef.current = null;
    }
  }, [state.revision, state.repairState, dispatch]);

  // Watch for repair validation result
  useEffect(() => {
    const pending = pendingValidationRef.current;
    if (!pending) return;
    if (!state.repairValidation) return;

    const validation = state.repairValidation;
    // Clear the validation marker so it only fires once
    dispatch({ type: "SET_REPAIR_VALIDATION", valid: false, id: "" });
    pendingValidationRef.current = null;

    // Guard 3: revision must still match
    if (state.revision !== pending.analysisRevision) {
      dispatch({ type: "CLEAR_REPAIR" });
      return;
    }

    if (validation.valid) {
      dispatch({
        type: "SET_RESULT",
        result: {
          action: "repair",
          format: "json",
          revision: state.revision,
          text: pending.candidate.repairedText,
        },
      });
      dispatch({ type: "SET_REPAIR_ACCEPTED" });
      dispatch({ type: "CLEAR_REPAIR" });
    } else {
      dispatch({
        type: "SET_RESULT_ERROR",
        error: "Repair produced invalid JSON. Please edit manually.",
      });
      dispatch({ type: "CLEAR_REPAIR" });
    }
  }, [state.repairValidation, state.revision, dispatch]);

  const analysis = state.repairAnalysis;

  const isSafe =
    state.repairState === "ready" && analysis !== null && analysis.kind === "safe";

  const isAmbiguous =
    state.repairState === "ready" && analysis !== null && analysis.kind === "ambiguous";

  const isManual =
    state.repairState === "ready" && analysis !== null && analysis.kind === "manual";

  const analyzing = state.repairState === "analyzing";

  const repairError =
    state.resultError?.startsWith("Repair produced") === true
      ? state.resultError
      : null;

  const startRepairAnalysis = useCallback((): void => {
    if (!state.input) return;

    dispatch({ type: "SET_ANALYZING" });
    client.analyzeRepair({ revision: state.revision, text: state.input });
  }, [state.input, state.revision, client, dispatch]);

  const validateAndApply = useCallback(
    (candidate: RepairCandidate): void => {
      const analysisRevision = analysisRevisionRef.current;

      // Guard 2: refuse if revision changed between analysis and accept
      if (analysisRevision === null || analysisRevision !== state.revision) {
        dispatch({ type: "CLEAR_REPAIR" });
        return;
      }

      pendingValidationRef.current = { candidate, analysisRevision };

      client.validateResult({
        action: "repair",
        format: "json",
        revision: state.revision,
        text: candidate.repairedText,
      });
    },
    [state.revision, client, dispatch],
  );

  const acceptRepair = useCallback((): void => {
    if (analysis?.kind === "safe") {
      validateAndApply(analysis.candidate);
    }
  }, [analysis, validateAndApply]);

  const applyAmbiguousChoice = useCallback(
    (candidate: RepairCandidate): void => {
      validateAndApply(candidate);
    },
    [validateAndApply],
  );

  const rejectRepair = useCallback((): void => {
    pendingValidationRef.current = null;
    dispatch({ type: "CLEAR_REPAIR" });
  }, [dispatch]);

  const editManually = useCallback((): void => {
    pendingValidationRef.current = null;
    dispatch({ type: "CLEAR_REPAIR" });
    onEditManually?.();
  }, [dispatch, onEditManually]);

  return {
    showSafePreview: isSafe,
    safeCandidate: isSafe ? analysis.candidate : null,
    showAmbiguousChoices: isAmbiguous,
    ambiguousChoices: isAmbiguous ? analysis.choices : [],
    showManualGuidance: isManual,
    manualGuidance: isManual ? analysis.guidance : null,
    analyzing,
    repairError,
    startRepairAnalysis,
    acceptRepair,
    applyAmbiguousChoice,
    rejectRepair,
    editManually,
  };
}
