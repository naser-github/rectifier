import { describe, expect, it } from "vitest";

import {
  MAX_INPUT_BYTES,
  INPUT_SIZE_LIMIT_MESSAGE,
  FILE_SIZE_LIMIT_MESSAGE,
  getEncodedByteSize,
  isWithinSizeLimit,
  exceedsSizeLimit,
} from "../../src/lib/size";

// ---------------------------------------------------------------------------
// MAX_INPUT_BYTES constant
// ---------------------------------------------------------------------------

describe("MAX_INPUT_BYTES", () => {
  it("equals exactly 10 MiB (10 * 1024 * 1024)", () => {
    expect(MAX_INPUT_BYTES).toBe(10 * 1024 * 1024);
  });
});

// ---------------------------------------------------------------------------
// getEncodedByteSize — uses TextEncoder, not string .length
// ---------------------------------------------------------------------------

describe("getEncodedByteSize", () => {
  it("returns the same value as string length for ASCII-only input", () => {
    const text = "hello";
    expect(getEncodedByteSize(text)).toBe(5);
  });

  it("differs from .length for multi-byte (non-ASCII) characters", () => {
    // U+00E9 é is encoded as 2 bytes in UTF-8, but .length returns 1
    const text = "é";
    expect(text.length).toBe(1);
    expect(getEncodedByteSize(text)).toBe(2);
  });

  it("measures 3 bytes for a 3-byte UTF-8 character (e.g. Chinese)", () => {
    // U+4E2D 中 is 3 bytes in UTF-8, .length returns 1
    const text = "中";
    expect(text.length).toBe(1);
    expect(getEncodedByteSize(text)).toBe(3);
  });

  it("measures 4 bytes for a 4-byte UTF-8 character (emoji surrogate pair)", () => {
    // U+1F600 😀 is 4 bytes in UTF-8, but .length returns 2 (surrogate pair)
    const text = "😀";
    expect(text.length).toBe(2);
    expect(getEncodedByteSize(text)).toBe(4);
  });

  it("returns 0 for an empty string", () => {
    expect(getEncodedByteSize("")).toBe(0);
  });

  it("correctly counts a mixed ASCII + multi-byte string", () => {
    // "aé" = 1 byte (a) + 2 bytes (é) = 3 bytes; .length = 2
    const text = "aé";
    expect(text.length).toBe(2);
    expect(getEncodedByteSize(text)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Boundary conditions at exactly MAX_INPUT_BYTES and one byte over
// ---------------------------------------------------------------------------

describe("boundary conditions", () => {
  it("a string encoded to exactly MAX_INPUT_BYTES bytes is within the limit", () => {
    // Build a string of exactly MAX_INPUT_BYTES ASCII characters (1 byte each)
    const text = "a".repeat(MAX_INPUT_BYTES);
    expect(getEncodedByteSize(text)).toBe(MAX_INPUT_BYTES);
    expect(isWithinSizeLimit(text)).toBe(true);
    expect(exceedsSizeLimit(text)).toBe(false);
  });

  it("a string encoded to MAX_INPUT_BYTES + 1 bytes exceeds the limit", () => {
    const text = "a".repeat(MAX_INPUT_BYTES + 1);
    expect(getEncodedByteSize(text)).toBe(MAX_INPUT_BYTES + 1);
    expect(isWithinSizeLimit(text)).toBe(false);
    expect(exceedsSizeLimit(text)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isWithinSizeLimit and exceedsSizeLimit predicates
// ---------------------------------------------------------------------------

describe("isWithinSizeLimit", () => {
  it("returns true for an empty string", () => {
    expect(isWithinSizeLimit("")).toBe(true);
  });

  it("returns true for a small ASCII string", () => {
    expect(isWithinSizeLimit('{"a":1}')).toBe(true);
  });

  it("returns false for a string exceeding the limit", () => {
    const text = "a".repeat(MAX_INPUT_BYTES + 1);
    expect(isWithinSizeLimit(text)).toBe(false);
  });
});

describe("exceedsSizeLimit", () => {
  it("returns false for an empty string", () => {
    expect(exceedsSizeLimit("")).toBe(false);
  });

  it("returns false for a small ASCII string", () => {
    expect(exceedsSizeLimit('{"a":1}')).toBe(false);
  });

  it("returns true for a string exceeding the limit", () => {
    const text = "a".repeat(MAX_INPUT_BYTES + 1);
    expect(exceedsSizeLimit(text)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Limit message constants
// ---------------------------------------------------------------------------

describe("INPUT_SIZE_LIMIT_MESSAGE (paste/typed-input path)", () => {
  it("is a non-empty string", () => {
    expect(typeof INPUT_SIZE_LIMIT_MESSAGE).toBe("string");
    expect(INPUT_SIZE_LIMIT_MESSAGE.length).toBeGreaterThan(0);
  });

  it("mentions 10 MB (plain language per PRD 6.2)", () => {
    expect(INPUT_SIZE_LIMIT_MESSAGE).toMatch(/10\s*MB/i);
  });

  it("does not lead with 'Files' (worded for an editing user)", () => {
    expect(INPUT_SIZE_LIMIT_MESSAGE.startsWith("Files")).toBe(false);
  });
});

describe("FILE_SIZE_LIMIT_MESSAGE (file-upload path)", () => {
  it("is a non-empty string", () => {
    expect(typeof FILE_SIZE_LIMIT_MESSAGE).toBe("string");
    expect(FILE_SIZE_LIMIT_MESSAGE.length).toBeGreaterThan(0);
  });

  it("mentions 10 MB (plain language per PRD 6.2)", () => {
    expect(FILE_SIZE_LIMIT_MESSAGE).toMatch(/10\s*MB/i);
  });

  it("refers to files (upload context)", () => {
    expect(FILE_SIZE_LIMIT_MESSAGE).toMatch(/file/i);
  });
});
