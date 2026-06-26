import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  INITIAL_WORKSPACE_STATE,
  type WorkspaceAction,
  type WorkspaceState,
} from "../domain/workspace";
import { workspaceReducer } from "../state/workspaceReducer";
import type { WorkerClient } from "./useWorkerClient";
import type { LoadResult } from "./useWorkspacePersistence";
import { useWorkspacePersistence } from "./useWorkspacePersistence";
import { checkPasteSize } from "../lib/files";

const DEBOUNCE_MS = 300;

export interface WorkspaceController {
  readonly state: WorkspaceState;
  readonly dispatch: React.Dispatch<WorkspaceAction>;
  readonly handleInputChange: (text: string) => void;
  readonly handleUpload: (text: string) => void;
  readonly handleClear: () => void;
  readonly clearSaved: () => Promise<void>;
  readonly loadResult: LoadResult | null;
  readonly loadError: boolean;
}

/**
 * Orchestrates the workspace reducer, worker validation, and persistence.
 *
 * - Manages input changes (debounced typing, immediate upload).
 * - Connects worker validation responses to the reducer.
 * - Persists the latest workspace after an idle delay.
 * - Restores a saved workspace or loads the first-visit sample on mount.
 */
export function useWorkspaceController(client: WorkerClient): WorkspaceController {
  const [state, dispatch] = useReducer(workspaceReducer, INITIAL_WORKSPACE_STATE);
  const { loadResult, loadError, clearSaved, save } = useWorkspacePersistence();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // -----------------------------------------------------------------------
  // Apply persisted state when load completes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!loadResult || loadedRef.current) return;
    loadedRef.current = true;

    if (loadResult.kind === "saved") {
      dispatch({ type: "SET_LOADED_STATE", state: loadResult.state });
    } else {
      // First visit — load sample with isExample: true
      dispatch({
        type: "SET_INPUT",
        text: loadResult.state.input,
        isUpload: true,
      });
      // Mark the input as the example
      dispatch({ type: "SET_EXAMPLE" });
    }
  }, [loadResult]);

  // -----------------------------------------------------------------------
  // Wire worker responses to the reducer
  // -----------------------------------------------------------------------
  useEffect(() => {
    client.setResponseHandler((response) => {
      switch (response.kind) {
        case "source-validated":
          dispatch({
            type: "SET_VALIDATION",
            diagnostics: response.diagnostics,
            eligibility: response.eligibility,
            revision: response.revision,
          });
          break;
        case "repair-analysis-complete":
          dispatch({
            type: "SET_REPAIR_ANALYSIS",
            analysis: response.analysis,
            revision: response.revision,
          });
          break;
        case "result-validation-complete":
          dispatch({
            type: "SET_REPAIR_VALIDATION",
            valid: response.valid,
            id: response.id,
          });
          break;
        case "format-complete":
          dispatch({
            type: "SET_RESULT",
            result: response.result,
          });
          break;
        case "conversion-complete":
          dispatch({
            type: "SET_RESULT",
            result: response.result,
          });
          break;
        case "schema-validation-complete":
          dispatch({
            type: "SET_SCHEMA_DIAGNOSTICS",
            diagnostics: response.diagnostics,
          });
          break;
      }
    });
  }, [client]);

  // -----------------------------------------------------------------------
  // Send input to the worker for validation
  // -----------------------------------------------------------------------
  const sendToWorker = useCallback(
    (text: string): void => {
      // Dispatch SET_VALIDATING so UI can show "Checking…"
      dispatch({ type: "SET_VALIDATING" });
      client.setSource({ revision: state.revision + 1, text });
    },
    [client, state.revision],
  );

  // -----------------------------------------------------------------------
  // Handle typed/pasted input (debounced)
  // -----------------------------------------------------------------------
  const handleInputChange = useCallback(
    (text: string): void => {
      // Cancel pending debounce
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Reject oversized input
      const limitMessage = checkPasteSize(text);
      if (limitMessage !== null) {
        dispatch({
          type: "SET_INPUT",
          text,
          isUpload: false,
        });
        return;
      }

      // Update the input immediately (clears dependent state)
      dispatch({ type: "SET_INPUT", text, isUpload: false });

      // Debounce validation
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        sendToWorker(text);
      }, DEBOUNCE_MS);
    },
    [sendToWorker],
  );

  // -----------------------------------------------------------------------
  // Handle file upload (immediate)
  // -----------------------------------------------------------------------
  const handleUpload = useCallback(
    (text: string): void => {
      // Cancel pending debounce
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      dispatch({ type: "SET_INPUT", text, isUpload: true });
      sendToWorker(text);
    },
    [sendToWorker],
  );

  // -----------------------------------------------------------------------
  // Handle clear
  // -----------------------------------------------------------------------
  const handleClear = useCallback((): void => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    dispatch({ type: "CLEAR_INPUT" });
  }, []);

  // -----------------------------------------------------------------------
  // Save state on changes (debounced via persistence hook)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (state.revision > 0) {
      save(state);
    }
  }, [state, save]);

  // -----------------------------------------------------------------------
  // Cleanup debounce on unmount
  // -----------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    state,
    dispatch,
    handleInputChange,
    handleUpload,
    handleClear,
    clearSaved,
    loadResult,
    loadError,
  };
}
