import "@testing-library/jest-dom/vitest";

import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkerLike } from "../../src/hooks/useWorkerClient";
import type { WorkerRequest, WorkerResponse } from "../../src/domain/workerProtocol";
import type { Diagnostic } from "../../src/domain/diagnostics";
import { createWorkerClient } from "../../src/hooks/useWorkerClient";
import { useAutoValidation } from "../../src/hooks/useAutoValidation";

// ---------------------------------------------------------------------------
// Fake worker
// ---------------------------------------------------------------------------

interface FakeWorker extends WorkerLike {
  post: (request: WorkerRequest) => void;
  simulateResponse(response: WorkerResponse): void;
  getLastPost(): WorkerRequest | undefined;
  getPostCallCount(): number;
}

const createFakeWorker = (): FakeWorker => {
  let handler: ((event: { data: WorkerResponse }) => void) | null = null;
  const calls: WorkerRequest[] = [];

  return {
    get onmessage() {
      return handler;
    },
    set onmessage(h: ((event: { data: WorkerResponse }) => void) | null) {
      handler = h;
    },
    post(request: WorkerRequest): void {
      calls.push(request);
    },
    terminate: vi.fn(() => undefined),
    simulateResponse(response: WorkerResponse): void {
      handler?.({ data: response });
    },
    getLastPost(): WorkerRequest | undefined {
      return calls[calls.length - 1];
    },
    getPostCallCount(): number {
      return calls.length;
    },
  };
};

const confirmedDiagnostic = (offset: number): Diagnostic => ({
  code: "json.test-error",
  message: "Test error",
  position: { offset, line: 1, column: offset + 1 },
  reliability: "confirmed",
  repairState: "not-applicable",
  severity: "error",
});

const makeDiagnostic = (overrides: {
  readonly code: string;
  readonly message: string;
  readonly offset: number;
}): Diagnostic => ({
  code: overrides.code,
  message: overrides.message,
  position: { offset: overrides.offset, line: 1, column: overrides.offset + 1 },
  reliability: "confirmed",
  repairState: "not-applicable",
  severity: "error",
});

// ---------------------------------------------------------------------------
// 300 ms debounce for typing
// ---------------------------------------------------------------------------

describe("useAutoValidation — 300 ms debounce for typing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT validate immediately on text change", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    act(() => {
      result.current.setSource('{"a":1}', false);
    });

    // post should NOT be called yet (within debounce window)
    expect(fakeWorker.getPostCallCount()).toBe(0);
  });

  it("validates after 300 ms debounce for typed input", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    act(() => {
      result.current.setSource('{"a":1}', false);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(fakeWorker.getPostCallCount()).toBe(1);
    const lastPost = fakeWorker.getLastPost();
    expect(lastPost?.kind).toBe("set-source");
  });

  it("resets the debounce timer when text changes rapidly", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    act(() => {
      result.current.setSource('{"a"', false);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current.setSource('{"a":1}', false);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Still within the second debounce window — must NOT have posted
    expect(fakeWorker.getPostCallCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Now 300 ms after the second setSource — must post exactly once
    expect(fakeWorker.getPostCallCount()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Immediate validation for uploads
// ---------------------------------------------------------------------------

describe("useAutoValidation — immediate validation for uploads", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validates immediately when isUpload=true (no 300 ms wait)", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    act(() => {
      result.current.setSource('{"uploaded":true}', true);
    });

    // No timer advance — must have posted immediately
    expect(fakeWorker.getPostCallCount()).toBe(1);
    const lastPost = fakeWorker.getLastPost();
    expect(lastPost?.kind).toBe("set-source");
  });
});

// ---------------------------------------------------------------------------
// Over-limit paste keeps the last accepted revision
// ---------------------------------------------------------------------------

describe("useAutoValidation — over-limit input", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects input that exceeds 10 MB and does not advance revision", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    // Accept first valid source at revision 0 (after debounce)
    act(() => {
      result.current.setSource('{"valid":true}', false);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const countAfterFirst = fakeWorker.getPostCallCount();
    expect(countAfterFirst).toBe(1);

    // Now try to set > 10 MB source
    const oversized = "x".repeat(11 * 1024 * 1024);
    act(() => {
      result.current.setSource(oversized, false);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Must NOT have sent the oversized source to the worker
    expect(fakeWorker.getPostCallCount()).toBe(countAfterFirst);

    // sizeError must be set
    expect(result.current.sizeError).not.toBeNull();
  });

  it("clears size error when input is back within limit", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    const oversized = "x".repeat(11 * 1024 * 1024);

    act(() => {
      result.current.setSource(oversized, false);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.sizeError).not.toBeNull();

    act(() => {
      result.current.setSource('{"small":true}', false);
    });

    // sizeError should clear immediately when back within limit
    expect(result.current.sizeError).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Stale responses are ignored
// ---------------------------------------------------------------------------

describe("useAutoValidation — stale response handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores a stale response arriving AFTER the fresh one (fresh value retained)", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    // Send first source (typed — debounced) → older job/revision.
    act(() => {
      result.current.setSource('{"broken"', false);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const firstPost = fakeWorker.getLastPost();
    const firstJobId = firstPost?.id ?? "job-1";
    const firstRevision =
      firstPost?.kind === "set-source" ? firstPost.source.revision : 1;

    // Send second source (typed — debounced) → newer job/revision.
    act(() => {
      result.current.setSource('{"valid":true}', false);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const secondPost = fakeWorker.getLastPost();
    const secondJobId = secondPost?.id ?? "job-2";
    const secondRevision =
      secondPost?.kind === "set-source" ? secondPost.source.revision : 2;

    // Distinguishable diagnostics so the assertion can only pass when stale
    // filtering actually works (not via last-write-wins).
    const freshError = makeDiagnostic({
      code: "json.fresh",
      message: "Fresh error",
      offset: 3,
    });
    const staleError = makeDiagnostic({
      code: "json.stale",
      message: "Stale error",
      offset: 0,
    });

    // CURRENT/newer response arrives FIRST and is applied.
    act(() => {
      fakeWorker.simulateResponse({
        id: secondJobId,
        kind: "source-validated",
        revision: secondRevision,
        diagnostics: [freshError],
        eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      });
    });

    expect(result.current.diagnostics).toEqual([freshError]);

    // STALE older-job/older-revision response arrives LATE. The client's
    // latestJobId guard drops it; the fresh value must remain.
    act(() => {
      fakeWorker.simulateResponse({
        id: firstJobId,
        kind: "source-validated",
        revision: firstRevision,
        diagnostics: [staleError],
        eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      });
    });

    // State STILL reflects the fresh value — the stale response was dropped.
    expect(result.current.diagnostics).toEqual([freshError]);
  });

  it("independent revision guard: ignores an older-revision response delivered straight to the handler", () => {
    // Bypass the worker-client job filter and drive the hook's own handler
    // directly, proving the hook's belt-and-suspenders revision guard works
    // even when a stale response slips past the client filter.
    const fakeWorker = createFakeWorker();
    let capturedHandler: ((response: WorkerResponse) => void) | null = null;
    const client = createWorkerClient(fakeWorker, () => undefined);
    const originalSetHandler = client.setResponseHandler.bind(client);
    // Capture whatever handler the hook installs.
    client.setResponseHandler = (handler): void => {
      capturedHandler = handler;
      originalSetHandler(handler);
    };

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    // Advance to a newer revision via an upload (immediate, no debounce).
    act(() => {
      result.current.setSource('{"valid":true}', true);
    });

    const post = fakeWorker.getLastPost();
    const currentRevision = post?.kind === "set-source" ? post.source.revision : 1;

    const freshError = makeDiagnostic({
      code: "json.fresh",
      message: "Fresh error",
      offset: 2,
    });
    const staleError = makeDiagnostic({
      code: "json.stale",
      message: "Stale error",
      offset: 0,
    });

    // Apply the current-revision response.
    act(() => {
      capturedHandler?.({
        id: "any",
        kind: "source-validated",
        revision: currentRevision,
        diagnostics: [freshError],
        eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      });
    });

    expect(result.current.diagnostics).toEqual([freshError]);

    // Deliver an OLDER-revision response straight to the handler. The hook's
    // own revision guard (revision < current) must drop it.
    act(() => {
      capturedHandler?.({
        id: "any",
        kind: "source-validated",
        revision: currentRevision - 1,
        diagnostics: [staleError],
        eligibility: { isEligible: false, reason: "valid-json", diagnosticCode: "" },
      });
    });

    // Fresh value retained — stale older-revision response was ignored.
    expect(result.current.diagnostics).toEqual([freshError]);
  });

  it("surfaces diagnostics from a source-validated response", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    act(() => {
      result.current.setSource('{"broken"', true);
    });

    const lastPost = fakeWorker.getLastPost();
    const jobId = lastPost?.id ?? "job-1";
    const revision = lastPost?.kind === "set-source" ? lastPost.source.revision : 1;

    const error = confirmedDiagnostic(5);

    act(() => {
      fakeWorker.simulateResponse({
        id: jobId,
        kind: "source-validated",
        revision,
        diagnostics: [error],
        eligibility: {
          isEligible: false,
          reason: "unsupported-diagnostic",
          diagnosticCode: "json.test-error",
        },
      });
    });

    expect(result.current.diagnostics).toHaveLength(1);
    expect(result.current.diagnostics[0]).toEqual(error);
  });
});

// ---------------------------------------------------------------------------
// Exposed state
// ---------------------------------------------------------------------------

describe("useAutoValidation — exposed state", () => {
  it("starts with empty diagnostics and null sizeError", () => {
    const fakeWorker = createFakeWorker();
    const client = createWorkerClient(fakeWorker, () => undefined);

    const { result } = renderHook(() =>
      useAutoValidation({ client, initialRevision: 0 }),
    );

    expect(result.current.diagnostics).toHaveLength(0);
    expect(result.current.sizeError).toBeNull();
    expect(result.current.eligibility).toBeNull();
  });
});
