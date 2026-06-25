/**
 * Input size constants and helpers for enforcing the 10 MB limit (PRD §6.2,
 * §15). All size checks use encoded UTF-8 byte counts via TextEncoder, not
 * string .length, so multi-byte characters are measured correctly.
 */

// 10 MB input limit (10 * 1024 * 1024 bytes).
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/**
 * User-facing message for the file-upload path when a file exceeds the
 * 10 MB limit (PRD §6.2).
 */
export const FILE_SIZE_LIMIT_MESSAGE =
  "Files larger than 10 MB are not supported. Reduce the file size and try again.";

/**
 * User-facing message for the paste/typed-input path when input exceeds the
 * 10 MB limit (PRD §6.2). Worded for an editing user rather than a file upload.
 */
export const INPUT_SIZE_LIMIT_MESSAGE =
  "Input larger than 10 MB is not supported. Reduce the size and try again.";

/**
 * Returns the encoded UTF-8 byte size of a string.
 * Uses TextEncoder so multi-byte characters are counted correctly.
 */
export function getEncodedByteSize(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/**
 * Returns true when the encoded UTF-8 byte size of `text` is within the
 * 10 MB limit (i.e. ≤ MAX_INPUT_BYTES).
 */
export function isWithinSizeLimit(text: string): boolean {
  return getEncodedByteSize(text) <= MAX_INPUT_BYTES;
}

/**
 * Returns true when the encoded UTF-8 byte size of `text` exceeds the
 * 10 MB limit (i.e. > MAX_INPUT_BYTES). Complement of isWithinSizeLimit.
 */
export function exceedsSizeLimit(text: string): boolean {
  return getEncodedByteSize(text) > MAX_INPUT_BYTES;
}
