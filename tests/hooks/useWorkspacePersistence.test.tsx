import "@testing-library/jest-dom/vitest";

import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_WORKSPACE_STATE } from "../../src/domain/workspace";
import { useWorkspacePersistence } from "../../src/hooks/useWorkspacePersistence";
import { SAMPLE_JSON } from "../../src/lib/sampleJson";

// ---------------------------------------------------------------------------
// Mock idb-keyval
// ---------------------------------------------------------------------------

type Store = Record<string, unknown>;
let mockStore: Store = {};
const mockGet = vi.fn((key: string): Promise<unknown> => {
  return Promise.resolve(mockStore[key]);
});
const mockSet = vi.fn((key: string, value: unknown): Promise<void> => {
  mockStore[key] = value;
  return Promise.resolve();
});
const mockDel = vi.fn((key: string): Promise<void> => {
  Reflect.deleteProperty(mockStore, key);
  return Promise.resolve();
});

vi.mock("idb-keyval", () => ({
  get: (key: string) => {
    return mockGet(key);
  },
  set: (key: string, value: unknown) => {
    return mockSet(key, value);
  },
  del: (key: string) => {
    return mockDel(key);
  },
}));

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("useWorkspacePersistence", () => {
  beforeEach(() => {
    mockStore = {};
    mockGet.mockClear();
    mockSet.mockClear();
    mockDel.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // First visit
  // -----------------------------------------------------------------------

  it("loads the sample JSON on first visit (no saved workspace)", async () => {
    const { result } = renderHook(() => useWorkspacePersistence());

    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    expect(result.current.loadResult?.kind).toBe("first-visit");
    if (result.current.loadResult?.kind === "first-visit") {
      expect(result.current.loadResult.isExample).toBe(true);
      expect(result.current.loadResult.state.input).toBe(SAMPLE_JSON);
    }
    expect(result.current.loadError).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Saved workspace
  // -----------------------------------------------------------------------

  it("restores a saved workspace when one exists", async () => {
    const saved = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"saved":true}',
      revision: 3,
      inputSize: 14,
    };
    mockStore = { "rectifier-workspace": saved };

    const { result } = renderHook(() => useWorkspacePersistence());

    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    expect(result.current.loadResult?.kind).toBe("saved");
    if (result.current.loadResult?.kind === "saved") {
      expect(result.current.loadResult.state.input).toBe('{"saved":true}');
      expect(result.current.loadResult.state.revision).toBe(3);
    }
  });

  it("falls back to first visit when saved workspace has no input", async () => {
    mockStore = { "rectifier-workspace": { ...INITIAL_WORKSPACE_STATE } };

    const { result } = renderHook(() => useWorkspacePersistence());

    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    expect(result.current.loadResult?.kind).toBe("first-visit");
  });

  // -----------------------------------------------------------------------
  // Storage failure
  // -----------------------------------------------------------------------

  it("handles storage failure on load and falls back to first-visit sample", async () => {
    mockGet.mockRejectedValueOnce(new Error("Storage unavailable"));

    const { result } = renderHook(() => useWorkspacePersistence());

    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    expect(result.current.loadError).toBe(true);
    expect(result.current.loadResult?.kind).toBe("first-visit");
    if (result.current.loadResult?.kind === "first-visit") {
      expect(result.current.loadResult.state.input).toBe(SAMPLE_JSON);
    }
  });

  // -----------------------------------------------------------------------
  // Save (debounced)
  // -----------------------------------------------------------------------

  it("saves the workspace after an idle delay", async () => {
    const { result } = renderHook(() => useWorkspacePersistence());

    // Wait for initial load (real timers)
    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    // Switch to fake timers for the save delay
    vi.useFakeTimers();

    const state = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"a":1}',
      revision: 1,
      inputSize: 7,
    };

    act(() => {
      result.current.save(state);
    });

    // Should not have saved yet (within debounce window)
    expect(mockSet).not.toHaveBeenCalled();

    // Advance past the save delay
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockSet).toHaveBeenCalledWith("rectifier-workspace", state);
  });

  it("debounces multiple rapid saves, saving only the latest", async () => {
    const { result } = renderHook(() => useWorkspacePersistence());

    // Wait for initial load (real timers)
    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    // Switch to fake timers for the save delay
    vi.useFakeTimers();

    const firstState = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"first":1}',
      revision: 1,
      inputSize: 12,
    };
    const secondState = {
      ...INITIAL_WORKSPACE_STATE,
      input: '{"second":2}',
      revision: 2,
      inputSize: 13,
    };

    act(() => {
      result.current.save(firstState);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      result.current.save(secondState);
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Should have saved only the second state (latest)
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith("rectifier-workspace", secondState);
  });

  // -----------------------------------------------------------------------
  // Clear saved
  // -----------------------------------------------------------------------

  it("clearSaved removes the persisted workspace", async () => {
    mockStore = {
      "rectifier-workspace": { ...INITIAL_WORKSPACE_STATE, input: "data" },
    };

    const { result } = renderHook(() => useWorkspacePersistence());

    await waitFor(() => {
      expect(result.current.loadResult).not.toBeNull();
    });

    await act(async () => {
      await result.current.clearSaved();
    });

    expect(mockDel).toHaveBeenCalledWith("rectifier-workspace");
    // Store should no longer have the workspace
    expect(mockStore["rectifier-workspace"]).toBeUndefined();
  });
});
