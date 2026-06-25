import { describe, expect, it, vi } from "vitest";

import {
  MAX_INPUT_BYTES,
  INPUT_SIZE_LIMIT_MESSAGE,
  FILE_SIZE_LIMIT_MESSAGE,
} from "../../src/lib/size";
import type { ReadableFile } from "../../src/lib/files";
import {
  readJsonFile,
  checkPasteSize,
  UNSUPPORTED_TYPE_MESSAGE,
} from "../../src/lib/files";

// ---------------------------------------------------------------------------
// Helpers: build ReadableFile-compatible fakes
// ---------------------------------------------------------------------------

/**
 * Creates a ReadableFile fake whose .text() is a spy that throws by default,
 * so tests assert it was never called when the file is rejected before reading.
 */
function makeFakeFile({
  name,
  size,
  textImpl,
}: {
  name: string;
  size: number;
  textImpl?: () => Promise<string>;
}): ReadableFile {
  const textFn: () => Promise<string> =
    textImpl ??
    (() => {
      throw new Error("text() must not be called on an over-limit file");
    });

  return { name, size, text: textFn };
}

/**
 * Creates a ReadableFile whose .text() resolves to the given content string.
 * Uses a spy so callers can assert call counts.
 */
function makeReadableFile(
  name: string,
  content: string,
): ReadableFile & {
  textSpy: ReturnType<typeof vi.fn>;
} {
  const textSpy = vi.fn<() => Promise<string>>().mockResolvedValue(content);
  return {
    name,
    size: new TextEncoder().encode(content).byteLength,
    text: textSpy,
    textSpy,
  };
}

// ---------------------------------------------------------------------------
// Rejection: oversize file.size — content must NOT be read
// ---------------------------------------------------------------------------

describe("readJsonFile — oversize file.size rejected without reading", () => {
  it("returns too-large rejection when file.size > MAX_INPUT_BYTES", async () => {
    const textSpy = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("text() must not be called"));

    const file = makeFakeFile({
      name: "big.json",
      size: MAX_INPUT_BYTES + 1,
      textImpl: textSpy,
    });

    const result = await readJsonFile(file);

    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.reason).toBe("too-large");
    expect(result.message).toMatch(/10\s*MB/i);
    // Upload path uses the file-specific message.
    expect(result.message).toBe(FILE_SIZE_LIMIT_MESSAGE);
  });

  it("does NOT call file.text() when file.size exceeds the limit", async () => {
    const textSpy = vi.fn<() => Promise<string>>().mockResolvedValue("{}");

    const file = makeFakeFile({
      name: "big.json",
      size: MAX_INPUT_BYTES + 1,
      textImpl: textSpy,
    });

    await readJsonFile(file);

    expect(textSpy).not.toHaveBeenCalled();
  });

  it("returns too-large rejection for file.size exactly one byte over MAX_INPUT_BYTES", async () => {
    const file = makeFakeFile({
      name: "edge.json",
      size: MAX_INPUT_BYTES + 1,
    });

    const result = await readJsonFile(file);
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.reason).toBe("too-large");
  });
});

// ---------------------------------------------------------------------------
// Rejection: unsupported file type
// ---------------------------------------------------------------------------

describe("readJsonFile — unsupported file type", () => {
  it("returns unsupported-type rejection for a .txt file", async () => {
    const file = makeFakeFile({ name: "data.txt", size: 10 });

    const result = await readJsonFile(file);

    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.reason).toBe("unsupported-type");
    expect(result.message).toBe(UNSUPPORTED_TYPE_MESSAGE);
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("returns unsupported-type rejection for a .csv file", async () => {
    const file = makeFakeFile({ name: "data.csv", size: 10 });

    const result = await readJsonFile(file);

    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.reason).toBe("unsupported-type");
  });

  it("returns unsupported-type rejection for a file with no extension", async () => {
    const file = makeFakeFile({ name: "datafile", size: 10 });

    const result = await readJsonFile(file);

    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.reason).toBe("unsupported-type");
  });
});

// ---------------------------------------------------------------------------
// Acceptance: .json file within the limit
// ---------------------------------------------------------------------------

describe("readJsonFile — accepted .json file", () => {
  it("returns accepted result with text and byteSize for a small .json file", async () => {
    const content = '{"hello":"world"}';
    const file = makeReadableFile("data.json", content);

    const result = await readJsonFile(file);

    expect(result.kind).toBe("accepted");
    if (result.kind !== "accepted") return;
    expect(result.text).toBe(content);
    expect(result.byteSize).toBe(new TextEncoder().encode(content).byteLength);
  });

  it("returns the exact text including whitespace for a pretty-printed .json file", async () => {
    const content = '{\n  "a": 1,\n  "b": true\n}';
    const file = makeReadableFile("pretty.json", content);

    const result = await readJsonFile(file);

    expect(result.kind).toBe("accepted");
    if (result.kind !== "accepted") return;
    expect(result.text).toBe(content);
  });

  it("accepts a file at exactly MAX_INPUT_BYTES", async () => {
    const content = "a".repeat(MAX_INPUT_BYTES);
    const file = makeReadableFile("exact.json", content);

    const result = await readJsonFile(file);

    expect(result.kind).toBe("accepted");
  });
});

// ---------------------------------------------------------------------------
// Rejection: decoded text exceeds limit (post-read byte check)
// ---------------------------------------------------------------------------

describe("readJsonFile — decoded text exceeds limit after reading", () => {
  it("returns too-large rejection when decoded text byteSize exceeds MAX_INPUT_BYTES", async () => {
    // file.size passes the pre-read check (≤ MAX_INPUT_BYTES) but the text
    // returned by .text() is one byte over — simulating a file with incorrect
    // size metadata (e.g. gzip-compressed on disk).
    const oversizeContent = "a".repeat(MAX_INPUT_BYTES + 1);
    const textSpy = vi.fn<() => Promise<string>>().mockResolvedValue(oversizeContent);

    const file = makeFakeFile({
      name: "sneaky.json",
      size: MAX_INPUT_BYTES, // passes pre-read check
      textImpl: textSpy,
    });

    const result = await readJsonFile(file);

    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.reason).toBe("too-large");
    expect(result.message).toMatch(/10\s*MB/i);
    expect(result.message).toBe(FILE_SIZE_LIMIT_MESSAGE);
  });
});

// ---------------------------------------------------------------------------
// checkPasteSize — paste/typed-input path
// ---------------------------------------------------------------------------

describe("checkPasteSize", () => {
  it("returns null for input within the limit", () => {
    expect(checkPasteSize('{"a":1}')).toBeNull();
  });

  it("returns null for input exactly at MAX_INPUT_BYTES", () => {
    expect(checkPasteSize("a".repeat(MAX_INPUT_BYTES))).toBeNull();
  });

  it("returns the paste/typed-input message when over the limit", () => {
    const result = checkPasteSize("a".repeat(MAX_INPUT_BYTES + 1));
    expect(result).toBe(INPUT_SIZE_LIMIT_MESSAGE);
  });

  it("uses the input-context message, not the file-context message", () => {
    const result = checkPasteSize("a".repeat(MAX_INPUT_BYTES + 1));
    expect(result).not.toBe(FILE_SIZE_LIMIT_MESSAGE);
  });
});

// ---------------------------------------------------------------------------
// No network — all file operations are local (structural guarantee)
// ---------------------------------------------------------------------------

describe("readJsonFile — no network", () => {
  it("does not call fetch when reading a .json file", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    const content = '{"safe":true}';
    const file = makeReadableFile("local.json", content);

    await readJsonFile(file);

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it("reads content via the ReadableFile.text() boundary, not via fetch", async () => {
    const content = '{"a":1}';
    const file = makeReadableFile("local.json", content);

    await readJsonFile(file);

    expect(file.textSpy).toHaveBeenCalledOnce();
  });
});
