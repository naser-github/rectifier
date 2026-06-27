/**
 * Deterministic large JSON fixture generator.
 *
 * Produces predictable JSON of approximately the target byte size.
 * The same inputs (`seed` + `targetBytes`) always produce the same output.
 */

export interface LargeFixture {
  readonly text: string;
  readonly byteSize: number;
}

/**
 * Generate deterministic valid JSON of approximately `targetBytes`.
 */
export function generateValidJson(targetBytes: number, seed = 1): LargeFixture {
  const obj: Record<string, unknown> = {};
  let i = seed;

  // Each entry adds ~40-50 bytes. Fill until we're close.
  while (new Blob([JSON.stringify(obj)]).size < targetBytes * 0.9) {
    obj["key_" + String(i)] = `value_${String(i)}`.repeat(10);
    i++;
  }

  const text = JSON.stringify(obj, null, 2);
  return { text, byteSize: new Blob([text]).size };
}

/**
 * Generate deterministic invalid JSON of approximately `targetBytes`.
 * The missing comma pattern repeats predictably.
 */
export function generateInvalidJson(targetBytes: number, seed = 1): LargeFixture {
  const obj: Record<string, unknown> = {};
  let i = seed;

  while (new Blob([JSON.stringify(obj)]).size < targetBytes * 0.9) {
    obj["key_" + String(i)] = `value_${String(i)}`.repeat(10);
    i++;
  }

  // Serialize compact, then remove commas between a few pairs to make it invalid
  let compact = JSON.stringify(obj);
  // Replace every 10th "," with "" to create "key": "val" "key2": "val2" missing commas
  compact = compact.replace(/(".*?":".*?"),/g, (match, _group, idx) => {
    return idx % 5 === 0 ? match.replace(",", "") : match;
  });

  const text = JSON.stringify(JSON.parse(compact), null, 2);

  // Now re-introduce missing commas at predictable positions
  const lines = text.split("\n");
  for (let li = 3; li < lines.length; li += 10) {
    const line = lines[li];
    if (line?.endsWith(",")) {
      lines[li] = line.slice(0, -1);
    }
  }

  const broken = lines.join("\n");
  return { text: broken, byteSize: new Blob([broken]).size };
}

/**
 * Deeply nested JSON fixture.
 */
export function generateDeepNestedJson(depth: number): LargeFixture {
  let current: unknown = "leaf";
  for (let i = 0; i < depth; i++) {
    current = { nested: current };
  }
  const text = JSON.stringify(current, null, 2);
  return { text, byteSize: new Blob([text]).size };
}

/**
 * Large array fixture.
 */
export function generateLargeArray(count: number): LargeFixture {
  const arr: number[] = [];
  for (let i = 0; i < count; i++) {
    arr.push(i);
  }
  const text = JSON.stringify(arr, null, 2);
  return { text, byteSize: new Blob([text]).size };
}
