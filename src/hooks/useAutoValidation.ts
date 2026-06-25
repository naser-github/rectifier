/**
 * Coordinates automatic validation via the worker client.
 *
 * Behaviour:
 * - Typed/pasted input is debounced by 300 ms before sending to the worker.
 * - Uploaded file content is validated immediately (no debounce).
 * - Input exceeding 10 MB is rejected; the last accepted revision is kept.
 * - Stale worker responses are ignored because createWorkerClient already
 *   tracks the latest job id and drops superseded responses.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { Diagnostic } from "../domain/diagnostics";
import type { RepairEligibility } from "../domain/repair";
import type { WorkerResponse } from "../domain/workerProtocol";
import type { WorkerClient } from "./useWorkerClient";
import { checkPasteSize } from "../lib/files";

const DEBOUNCE_MS = 300;

export interface UseAutoValidationOptions {
  /** Pre-created worker client (owned by the caller). */
  readonly client: WorkerClient;
  /**
   * The revision counter seed. The hook increments it on every accepted
   * source change. Start at 0 for a fresh workspace.
   */
  readonly initialRevision: number;
}

export interface UseAutoValidationResult {
  /** Confirmed + follow-on diagnostics from the latest source-validated response. */
  readonly diagnostics: readonly Diagnostic[];
  /** Repair eligibility from the latest source-validated response, or null before first response. */
  readonly eligibility: RepairEligibility | null;
  /**
   * Non-null when the most-recent setSource call was rejected for exceeding
   * 10 MB. Cleared as soon as setSource is called with an accepted size.
   */
  readonly sizeError: string | null;
  /**
   * Call on every editor change (typed/pasted) or file upload.
   *
   * @param text     The new source text.
   * @param isUpload When true the source is validated immediately (no debounce).
   */
  readonly setSource: (text: string, isUpload: boolean) => void;
}

export function useAutoValidation({
  client,
  initialRevision,
}: UseAutoValidationOptions): UseAutoValidationResult {
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([]);
  const [eligibility, setEligibility] = useState<RepairEligibility | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Monotonic revision counter — incremented on every accepted source.
  const revisionRef = useRef<number>(initialRevision);

  // Debounce timer handle.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wire the response handler once; keep it stable across renders.
  useEffect(() => {
    const handler = (response: WorkerResponse): void => {
      if (response.kind !== "source-validated") return;

      // Independent revision guard (belt-and-suspenders on top of the worker
      // client's job/revision filtering): never let a response for a revision
      // older than the latest one we sent overwrite current diagnostics. This
      // protects against any late/out-of-order delivery the client lets through.
      if (response.revision < revisionRef.current) return;

      setDiagnostics(response.diagnostics);
      setEligibility(response.eligibility);
    };

    client.setResponseHandler(handler);
  }, [client]);

  const sendToWorker = useCallback(
    (text: string): void => {
      revisionRef.current += 1;
      client.setSource({ revision: revisionRef.current, text });
    },
    [client],
  );

  const setSource = useCallback(
    (text: string, isUpload: boolean): void => {
      // Cancel any pending debounce first.
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Guard against oversized input.
      const limitMessage = checkPasteSize(text);
      if (limitMessage !== null) {
        setSizeError(limitMessage);
        // Do NOT advance revision or send to worker.
        return;
      }

      // Input is within limit — clear any prior size error.
      setSizeError(null);

      if (isUpload) {
        // Uploads validate immediately.
        sendToWorker(text);
      } else {
        // Typed/pasted input is debounced.
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          sendToWorker(text);
        }, DEBOUNCE_MS);
      }
    },
    [sendToWorker],
  );

  // Clean up the debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { diagnostics, eligibility, sizeError, setSource };
}
