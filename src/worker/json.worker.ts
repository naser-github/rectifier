import type { Diagnostic } from "../domain/diagnostics";
import type { RepairEligibility } from "../domain/repair";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerSourceRevision,
} from "../domain/workerProtocol";
import {
  analyzeJsonRepair,
  classifyRepairEligibility,
} from "../engine/repair/analyzeJson";
import { parseDiagnostics } from "./diagnostics";

export interface WorkerState {
  readonly source: WorkerSourceRevision | null;
}

export interface WorkerStep {
  readonly response: WorkerResponse;
  readonly state: WorkerState;
}

export const createInitialWorkerState = (): WorkerState => ({ source: null });

/**
 * Pure, exported request handler. It owns revision/job state and delegates all
 * repair decisions to the pure engine. It is unit-testable without a real
 * browser Worker.
 */
export const handleWorkerRequest = (
  state: WorkerState,
  request: WorkerRequest,
): WorkerStep => {
  switch (request.kind) {
    case "set-source":
      return handleSetSource(request);
    case "analyze-repair":
      return handleAnalyzeRepair(state, request);
    case "validate-result":
      return handleValidateResult(state, request);
    default:
      return {
        response: {
          id: request.id,
          kind: "failed",
          message: `Unsupported worker request kind: ${request.kind}.`,
        },
        state,
      };
  }
};

const handleSetSource = (
  request: Extract<WorkerRequest, { kind: "set-source" }>,
): WorkerStep => {
  const { source } = request;
  const raw = parseDiagnostics(source.text);
  const { diagnostics, eligibility } = resolveEligibility(raw, source.text);

  return {
    response: {
      diagnostics,
      eligibility,
      id: request.id,
      kind: "source-validated",
      revision: source.revision,
    },
    state: { source: { revision: source.revision, text: source.text } },
  };
};

const handleAnalyzeRepair = (
  state: WorkerState,
  request: Extract<WorkerRequest, { kind: "analyze-repair" }>,
): WorkerStep => {
  const stored = state.source;

  if (stored === null) {
    return {
      response: {
        id: request.id,
        kind: "failed",
        message:
          "No source revision is stored. Send the document with set-source before requesting repair analysis.",
      },
      state,
    };
  }

  if (request.source.revision !== stored.revision) {
    return {
      response: {
        id: request.id,
        kind: "failed",
        message: `Stale revision ${String(request.source.revision)} ignored; the stored revision is ${String(stored.revision)}.`,
        revision: stored.revision,
      },
      state,
    };
  }

  return {
    response: {
      analysis: analyzeJsonRepair(stored.text),
      id: request.id,
      kind: "repair-analysis-complete",
      revision: stored.revision,
    },
    state,
  };
};

/**
 * Derive eligibility and annotate repair state using the engine's
 * `classifyRepairEligibility`. The top confirmed diagnostic's code drives
 * the top-level eligibility. Each confirmed diagnostic's repair state is
 * also set by the engine. The engine is the sole authority; the worker never
 * derives eligibility or repair state independently.
 */
const resolveEligibility = (
  rawDiagnostics: readonly Diagnostic[],
  text: string,
): {
  readonly diagnostics: readonly Diagnostic[];
  readonly eligibility: RepairEligibility;
} => {
  const confirmed = rawDiagnostics.filter((d) => d.reliability === "confirmed");
  const topConfirmed = confirmed[0];

  // When there are no confirmed errors, the input is valid JSON. Use a
  // recognized rule code so the engine's `isStrictJson` short-circuit fires
  // and returns `valid-json`. The engine checks the rule table first, then
  // `isStrictJson`, so any recognized code reaches the validity check.
  const eligibilityCode =
    topConfirmed !== undefined ? topConfirmed.code : "json.missing-comma";

  const eligibility = classifyRepairEligibility({
    diagnosticCode: eligibilityCode,
    input: text,
  });

  if (rawDiagnostics.length === 0) {
    return { diagnostics: [], eligibility };
  }

  // Annotate each diagnostic's repairState via the engine.
  const diagnostics = rawDiagnostics.map((diagnostic): Diagnostic => {
    if (diagnostic.reliability !== "confirmed") {
      return { ...diagnostic, repairState: "manual" };
    }

    const thisEligibility = classifyRepairEligibility({
      diagnosticCode: diagnostic.code,
      input: text,
    });

    return {
      ...diagnostic,
      repairState: thisEligibility.isEligible ? "eligible" : "manual",
    };
  });

  return { diagnostics, eligibility };
};

const handleValidateResult = (
  state: WorkerState,
  request: Extract<WorkerRequest, { kind: "validate-result" }>,
): WorkerStep => {
  // Validate the result text ephemerally. Do NOT modify the stored source.
  const raw = parseDiagnostics(request.result.text);
  const confirmed = raw.filter((d) => d.reliability === "confirmed");
  const valid = confirmed.length === 0;

  return {
    response: {
      id: request.id,
      kind: "result-validation-complete",
      result: request.result,
      valid,
    },
    // State is unchanged: validate-result must not replace the stored source.
    state,
  };
};

interface DedicatedWorkerLikeGlobal {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
}

/**
 * Detects a dedicated worker global scope without relying on the WebWorker lib.
 * Vite serves this file as a module worker, where `importScripts` is not
 * available. A browser window has `window`; a dedicated worker does not.
 */
const getWorkerGlobal = (): DedicatedWorkerLikeGlobal | null => {
  if (typeof self === "undefined" || typeof window !== "undefined") {
    return null;
  }

  const candidate = self as unknown as Partial<DedicatedWorkerLikeGlobal>;

  if (typeof candidate.postMessage === "function") {
    return candidate as DedicatedWorkerLikeGlobal;
  }

  return null;
};

const workerGlobal = getWorkerGlobal();

if (workerGlobal !== null) {
  let workerState = createInitialWorkerState();

  workerGlobal.onmessage = (event: MessageEvent<WorkerRequest>): void => {
    const step = handleWorkerRequest(workerState, event.data);
    workerState = step.state;
    workerGlobal.postMessage(step.response);
  };
}
