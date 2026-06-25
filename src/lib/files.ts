/**
 * Local-only file-reading boundary for JSON upload (PRD §6.2, §17).
 *
 * - Reads files using the ReadableFile.text() boundary — no network call of any kind.
 * - Rejects oversize files by file.size BEFORE reading content (performance).
 * - Accepts only .json files; rejects other types.
 * - Re-checks encoded byte size after reading to guard against compression or
 *   incorrect file.size metadata.
 * - Returns a discriminated FileReadResult so callers handle every outcome.
 *
 * The ReadableFile interface is a minimal subset of the browser File/Blob API,
 * keeping the reading boundary substitutable in tests.
 *
 * The upload/clear request types (InputUploadRequest, InputClearRequest) are
 * defined here for the Input panel to consume. Epic 04 wires the actual icon
 * controls and full state reset; this module only exposes the request surface.
 */

import {
  MAX_INPUT_BYTES,
  INPUT_SIZE_LIMIT_MESSAGE,
  FILE_SIZE_LIMIT_MESSAGE,
  getEncodedByteSize,
} from "./size";

// ---------------------------------------------------------------------------
// File-reading boundary interface
// ---------------------------------------------------------------------------

/**
 * Minimal File/Blob-like interface consumed by readJsonFile.
 * Keeping it as a separate interface makes the reading boundary substitutable
 * in tests without depending on jsdom's incomplete File implementation.
 * In production, a browser File satisfies this interface.
 */
export interface ReadableFile {
  /** File name including extension (e.g. "data.json"). */
  readonly name: string;
  /** Reported byte size. May differ from decoded text size for compressed files. */
  readonly size: number;
  /** Reads the file as UTF-8 text. Must not make a network call. */
  text(): Promise<string>;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/** The file was read successfully and is within the size limit. */
interface AcceptedFileResult {
  readonly kind: "accepted";
  readonly text: string;
  readonly byteSize: number;
}

/** The file was rejected before or after reading. */
interface RejectedFileResult {
  readonly kind: "rejected";
  readonly reason: "too-large" | "unsupported-type";
  /** Plain-language explanation suitable for display to the user. */
  readonly message: string;
}

/** Discriminated union returned by readJsonFile. */
export type FileReadResult = AcceptedFileResult | RejectedFileResult;

// ---------------------------------------------------------------------------
// Upload / clear request surface (Epic 04 wires the actual controls)
// ---------------------------------------------------------------------------

/** Request to load a file's text into the Input panel. */
export interface InputUploadRequest {
  readonly kind: "upload";
  readonly text: string;
  readonly byteSize: number;
}

/** Request to clear the Input panel content. Epic 04 owns the full state reset. */
export interface InputClearRequest {
  readonly kind: "clear";
}

/** Union of all input panel requests exposed by this module. */
export type InputRequest = InputUploadRequest | InputClearRequest;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** User-facing message when an uploaded file is not a .json file (PRD §6.2). */
export const UNSUPPORTED_TYPE_MESSAGE =
  "Only .json files can be uploaded. Please select a file with a .json extension.";

// ---------------------------------------------------------------------------
// Size check for pasted / typed input (used by the Input panel — Task 04)
// ---------------------------------------------------------------------------

/**
 * Checks whether pasted or typed `text` fits within the 10 MB limit.
 * Returns the limit message when exceeded, or null when within the limit.
 * The Input panel calls this on every change to guard against oversize input.
 */
export function checkPasteSize(text: string): string | null {
  return getEncodedByteSize(text) > MAX_INPUT_BYTES ? INPUT_SIZE_LIMIT_MESSAGE : null;
}

// ---------------------------------------------------------------------------
// File upload boundary
// ---------------------------------------------------------------------------

/**
 * Reads a JSON file locally and returns a FileReadResult.
 *
 * Accepts any ReadableFile-compatible object (browser File satisfies this).
 *
 * Rejection order:
 * 1. file.size > MAX_INPUT_BYTES → too-large (content is never read).
 * 2. file.name does not end in .json → unsupported-type.
 * 3. Decoded text byte size > MAX_INPUT_BYTES → too-large.
 *
 * No network call is made. Content is read via ReadableFile.text() and treated
 * as plain text only; it is never executed (PRD §17).
 */
export async function readJsonFile(file: ReadableFile): Promise<FileReadResult> {
  // 1. Pre-read size check — avoids loading oversize content into memory.
  if (file.size > MAX_INPUT_BYTES) {
    return {
      kind: "rejected",
      reason: "too-large",
      message: FILE_SIZE_LIMIT_MESSAGE,
    };
  }

  // 2. File type check by name extension.
  if (!file.name.toLowerCase().endsWith(".json")) {
    return {
      kind: "rejected",
      reason: "unsupported-type",
      message: UNSUPPORTED_TYPE_MESSAGE,
    };
  }

  // 3. Read locally — no network.
  const text = await file.text();

  // 4. Post-read byte size check (guards against compressed/incorrect metadata).
  const byteSize = getEncodedByteSize(text);
  if (byteSize > MAX_INPUT_BYTES) {
    return {
      kind: "rejected",
      reason: "too-large",
      message: FILE_SIZE_LIMIT_MESSAGE,
    };
  }

  return { kind: "accepted", text, byteSize };
}
