import { get, set, del } from "idb-keyval";
import { useCallback, useEffect, useRef, useState } from "react";
import { INITIAL_WORKSPACE_STATE, type WorkspaceState } from "../domain/workspace";
import { SAMPLE_JSON } from "../lib/sampleJson";
import { getEncodedByteSize } from "../lib/size";

const STORAGE_KEY = "rectifier-workspace";

const IDLE_SAVE_DELAY_MS = 1_500;
const MAX_PERSISTED_INPUT_BYTES = 1024 * 1024;

export type LoadResult =
  | {
      readonly kind: "saved";
      readonly state: WorkspaceState;
    }
  | {
      readonly isExample: true;
      readonly kind: "first-visit";
      readonly state: WorkspaceState;
    };

export interface PersistenceAPI {
  readonly loadResult: LoadResult | null;
  readonly loadError: boolean;
  readonly clearSaved: () => Promise<void>;
  readonly save: (state: WorkspaceState) => void;
}

/**
 * Loads the saved workspace on mount and provides debounced save and clear.
 *
 * - On mount, checks IndexedDB for a saved workspace.
 * - If found, restores it as a "saved" workspace.
 * - If not found, sets the first-visit sample marked as `isExample`.
 * - `save()` debounces writes to IndexedDB so only the latest state is
 *   persisted after an idle delay.
 * - Storage failures never throw — they are surfaced through `loadError` and
 *   silently swallowed on save so core behaviour continues.
 */
export function useWorkspacePersistence(): PersistenceAPI {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Load saved workspace on mount
  useEffect(() => {
    let cancelled = false;

    get<WorkspaceState>(STORAGE_KEY)
      .then((saved) => {
        if (cancelled) return;

        if (saved?.input) {
          setLoadResult({ kind: "saved", state: saved });
        } else {
          setLoadResult({
            kind: "first-visit",
            isExample: true,
            state: {
              ...INITIAL_WORKSPACE_STATE,
              input: SAMPLE_JSON,
              inputSize: SAMPLE_JSON.length,
            },
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        // Fall back to first-visit sample when storage is unavailable
        setLoadResult({
          kind: "first-visit",
          isExample: true,
          state: {
            ...INITIAL_WORKSPACE_STATE,
            input: SAMPLE_JSON,
            inputSize: SAMPLE_JSON.length,
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced save
  const save = useCallback((state: WorkspaceState): void => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (getEncodedByteSize(state.input) > MAX_PERSISTED_INPUT_BYTES) {
      del(STORAGE_KEY).catch(() => {
        // Storage failure must never break core behaviour
      });
      return;
    }

    saveTimerRef.current = setTimeout(() => {
      set(STORAGE_KEY, state).catch(() => {
        // Storage failure must never break core behaviour
      });
    }, IDLE_SAVE_DELAY_MS);
  }, []);

  // Clear saved workspace
  const clearSaved = useCallback(async (): Promise<void> => {
    try {
      await del(STORAGE_KEY);
    } catch {
      // Storage failure must never break core behaviour
    }
  }, []);

  return { loadResult, loadError, clearSaved, save };
}
