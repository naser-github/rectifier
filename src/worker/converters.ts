import { dump as yamlDump } from "js-yaml";
import { XMLBuilder } from "fast-xml-parser";
import Papa from "papaparse";
import type { ResultDocument } from "../domain/result";
import type { FormatOperation } from "../domain/workerProtocol";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}

// ---------------------------------------------------------------------------
// Format (beautify / minify)
// ---------------------------------------------------------------------------

export function formatJson(
  text: string,
  operation: FormatOperation,
  revision: number,
): ResultDocument | null {
  try {
    const parsed = parseJson(text);
    const resultText =
      operation === "beautify"
        ? JSON.stringify(parsed, null, 2)
        : JSON.stringify(parsed);

    return {
      action: operation === "beautify" ? "beautify" : "minify",
      format: "json",
      revision,
      text: resultText,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Convert to YAML
// ---------------------------------------------------------------------------

export function convertToYaml(text: string, revision: number): ResultDocument | null {
  try {
    const parsed = parseJson(text);
    const resultText = yamlDump(parsed, { indent: 2, noRefs: true });

    return {
      action: "convert-yaml",
      format: "yaml",
      revision,
      text: resultText,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Convert to XML
// ---------------------------------------------------------------------------

export function convertToXml(text: string, revision: number): ResultDocument | null {
  try {
    const parsed = parseJson(text);

    const wrapped: Record<string, unknown> =
      typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null
        ? (parsed as Record<string, unknown>)
        : { root: parsed };

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const builder = new XMLBuilder({
      format: true,
      indentBy: "  ",
      suppressEmptyNode: true,
      ignoreAttributes: true,
    });

    const resultText = builder.build(wrapped);

    return {
      action: "convert-xml",
      format: "xml",
      revision,
      text: resultText,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Escape helpers for CSV flattening
// ---------------------------------------------------------------------------

const DOT_ESCAPE = "\\.";
const BACKSLASH_ESCAPE = "\\\\";

function escapePathKey(key: string): string {
  return key.replaceAll("\\", BACKSLASH_ESCAPE).replaceAll(".", DOT_ESCAPE);
}

// ---------------------------------------------------------------------------
// Flatten nested JSON for CSV
// ---------------------------------------------------------------------------

type FlatRow = Record<string, string>;

export function flattenForCsv(data: unknown): FlatRow[] | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const items: Record<string, unknown>[] = [];

  if (Array.isArray(data)) {
    if (data.length === 0) return null;

    for (const item of data) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return null;
      }
      items.push(item as Record<string, unknown>);
    }
  } else {
    items.push(data as Record<string, unknown>);
  }

  const columnOrder: string[] = [];
  const columnSet = new Set<string>();
  const rows: FlatRow[] = [];

  for (const item of items) {
    const row: FlatRow = {};
    const stack: { value: unknown; prefix: string }[] = [{ value: item, prefix: "" }];

    while (stack.length > 0) {
      const entry = stack.pop() as { value: unknown; prefix: string };
      const { value, prefix } = entry;

      if (typeof value !== "object" || value === null) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        const cell = value === null ? "null" : String(value);
        if (!columnSet.has(prefix)) {
          columnSet.add(prefix);
          columnOrder.push(prefix);
        }
        row[prefix] = cell;
        continue;
      }

      if (Array.isArray(value)) {
        const cell = JSON.stringify(value);
        if (!columnSet.has(prefix)) {
          columnSet.add(prefix);
          columnOrder.push(prefix);
        }
        row[prefix] = cell;
        continue;
      }

      const entries = Object.entries(value as Record<string, unknown>);
      // Push in reverse so the first entry is processed first (stack = LIFO)
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (!entry) continue;
        const [key, val] = entry;
        const escapedKey = escapePathKey(key);
        const path = prefix ? `${prefix}.${escapedKey}` : escapedKey;
        stack.push({ value: val, prefix: path });
      }
    }

    rows.push(row);
  }

  // Verify no single item produces duplicate column paths
  for (const row of rows) {
    const rowCols = new Set(Object.keys(row));
    if (rowCols.size !== Object.keys(row).length) {
      return null;
    }
  }

  // Build final rows using column order
  return rows.map((row) => {
    const ordered: FlatRow = {};
    for (const col of columnOrder) {
      if (col in row) {
        const val = row[col];
        ordered[col] = val ?? "";
      } else {
        ordered[col] = "";
      }
    }
    return ordered;
  });
}

export function convertToCsv(text: string, revision: number): ResultDocument | null {
  try {
    const parsed = parseJson(text);
    const rows = flattenForCsv(parsed);

    if (rows === null) {
      return null;
    }

    const csvResult = Papa.unparse(rows, { header: true });
    const resultText = csvResult.endsWith("\n") ? csvResult.slice(0, -1) : csvResult;

    return {
      action: "convert-csv",
      format: "csv",
      revision,
      text: resultText,
    };
  } catch {
    return null;
  }
}
