import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResultDocument } from "../../src/domain/result";
import type { WorkerResponse } from "../../src/domain/workerProtocol";
import { useWorkspaceController } from "../../src/hooks/useWorkspaceController";
import type {
  WorkerClient,
  WorkerResponseHandler,
} from "../../src/hooks/useWorkerClient";

vi.mock("idb-keyval", () => ({
  get: vi.fn(() => Promise.resolve(undefined)),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}));

const baseResult: ResultDocument = {
  action: "beautify",
  format: "json",
  revision: 1,
  text: '{"a":1}',
};

function createClient(): WorkerClient & {
  emit(response: WorkerResponse): void;
  validateResult: ReturnType<typeof vi.fn<(result: ResultDocument) => string>>;
} {
  let handler: WorkerResponseHandler = () => undefined;
  return {
    analyzeRepair: vi.fn(() => "repair-job"),
    convert: vi.fn(() => "convert-job"),
    dispose: vi.fn(),
    format: vi.fn(() => "format-job"),
    setResponseHandler(nextHandler): void {
      handler = nextHandler;
    },
    setSource: vi.fn(() => "source-job"),
    validateResult: vi.fn(() => "edited-result-job"),
    validateSchema: vi.fn(() => "schema-job"),
    emit(response: WorkerResponse): void {
      handler(response);
    },
  };
}

describe("useWorkspaceController edited result validation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("updates the result only after edited JSON validation succeeds", () => {
    const client = createClient();
    const { result } = renderHook(() => useWorkspaceController(client));
    const editedResult = { ...baseResult, text: '{"a":2}' };

    act(() => {
      result.current.dispatch({ type: "SET_RESULT", result: baseResult });
    });
    act(() => {
      result.current.handleResultEdit(editedResult);
    });

    expect(client.validateResult).toHaveBeenCalledWith(editedResult);
    expect(result.current.state.result?.text).toBe('{"a":1}');

    act(() => {
      client.emit({
        id: "edited-result-job",
        kind: "result-validation-complete",
        result: editedResult,
        valid: true,
      });
    });

    expect(result.current.state.result?.text).toBe('{"a":2}');
    expect(result.current.state.resultError).toBeNull();
  });

  it("keeps the previous result when edited JSON validation fails", () => {
    const client = createClient();
    const { result } = renderHook(() => useWorkspaceController(client));
    const editedResult = { ...baseResult, text: '{"a":}' };

    act(() => {
      result.current.dispatch({ type: "SET_RESULT", result: baseResult });
    });
    act(() => {
      result.current.handleResultEdit(editedResult);
    });
    act(() => {
      client.emit({
        id: "edited-result-job",
        kind: "result-validation-complete",
        result: editedResult,
        valid: false,
      });
    });

    expect(result.current.state.result?.text).toBe('{"a":1}');
    expect(result.current.state.resultError).toBe(
      "Edited result is invalid JSON. Tree and Object views still show the last valid result.",
    );
  });
});
