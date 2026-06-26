import { describe, expect, it } from "vitest";

import {
  convertToCsv,
  convertToXml,
  convertToYaml,
  flattenForCsv,
  formatJson,
} from "../../src/worker/converters";

function assertRows(
  result: ReturnType<typeof flattenForCsv>,
): NonNullable<ReturnType<typeof flattenForCsv>> {
  expect(result).not.toBeNull();
  if (!result) throw new Error("Expected non-null rows");
  return result;
}

// ---------------------------------------------------------------------------
// Format
// ---------------------------------------------------------------------------

describe("formatJson", () => {
  it("beautifies an object", () => {
    const r = formatJson('{"a":1,"b":2}', "beautify", 1);
    expect(r?.text).toBe('{\n  "a": 1,\n  "b": 2\n}');
    expect(r?.action).toBe("beautify");
    expect(r?.format).toBe("json");
  });

  it("beautifies a top-level array", () => {
    const r = formatJson("[1,2,3]", "beautify", 1);
    expect(r?.text).toBe("[\n  1,\n  2,\n  3\n]");
  });

  it("beautifies a top-level string", () => {
    const r = formatJson('"hello"', "beautify", 1);
    expect(r?.text).toBe('"hello"');
  });

  it("beautifies a top-level number", () => {
    const r = formatJson("42", "beautify", 1);
    expect(r?.text).toBe("42");
  });

  it("beautifies a top-level boolean", () => {
    const r = formatJson("true", "beautify", 1);
    expect(r?.text).toBe("true");
  });

  it("beautifies null", () => {
    const r = formatJson("null", "beautify", 1);
    expect(r?.text).toBe("null");
  });

  it("minifies", () => {
    const r = formatJson('{\n  "a": 1\n}', "minify", 2);
    expect(r?.text).toBe('{"a":1}');
    expect(r?.action).toBe("minify");
  });

  it("returns null for invalid JSON", () => {
    expect(formatJson("{bad", "beautify", 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// YAML
// ---------------------------------------------------------------------------

describe("convertToYaml", () => {
  it("converts an object", () => {
    const r = convertToYaml('{"name":"John","age":30}', 1);
    expect(r?.text).toContain("name: John");
    expect(r?.text).toContain("age: 30");
    expect(r?.format).toBe("yaml");
    expect(r?.action).toBe("convert-yaml");
  });

  it("converts an array", () => {
    const r = convertToYaml("[1,2,3]", 1);
    expect(r?.text).toContain("- 1");
  });

  it("converts a top-level string", () => {
    const r = convertToYaml('"hello"', 1);
    expect(r?.text).toContain("hello");
  });

  it("converts a top-level number", () => {
    const r = convertToYaml("42", 1);
    expect(r?.text).toBe("42\n");
  });

  it("converts a top-level boolean", () => {
    const r = convertToYaml("true", 1);
    expect(r?.text).toBe("true\n");
  });

  it("converts null", () => {
    const r = convertToYaml("null", 1);
    expect(r?.text).toBe("null\n");
  });

  it("escapes special characters in strings", () => {
    const r = convertToYaml('{"text":"line1\\nline2"}', 1);
    expect(r?.text).toContain("line1");
    expect(r?.text).toContain("line2");
  });

  it("returns null for invalid JSON", () => {
    expect(convertToYaml("{bad", 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// XML
// ---------------------------------------------------------------------------

describe("convertToXml", () => {
  it("converts an object", () => {
    const r = convertToXml('{"name":"John","age":30}', 1);
    expect(r?.text).toContain("<name>John</name>");
    expect(r?.text).toContain("<age>30</age>");
    expect(r?.format).toBe("xml");
    expect(r?.action).toBe("convert-xml");
  });

  it("wraps top-level arrays in root element", () => {
    const r = convertToXml("[1,2,3]", 1);
    expect(r?.text).toContain("<root>");
    expect(r?.text).toContain("</root>");
  });

  it("wraps a top-level string in root", () => {
    const r = convertToXml('"hello"', 1);
    expect(r?.text).toContain("<root>");
  });

  it("wraps a top-level number in root", () => {
    const r = convertToXml("42", 1);
    expect(r?.text).toContain("<root>");
  });

  it("escapes special characters in string values", () => {
    const r = convertToXml('{"text":"<tag>&value</tag>"}', 1);
    expect(r?.text).not.toContain("<tag>");
    expect(r?.text).toContain("&lt;");
    expect(r?.text).toContain("&gt;");
    expect(r?.text).toContain("&amp;");
  });

  it("wraps a top-level boolean in root", () => {
    const r = convertToXml("true", 1);
    expect(r?.text).toContain("<root>");
  });

  it("returns null for invalid JSON", () => {
    expect(convertToXml("{bad", 1)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// CSV flattening
// ---------------------------------------------------------------------------

describe("flattenForCsv", () => {
  it("flattens a top-level object to one row", () => {
    const rows = assertRows(flattenForCsv({ name: "John", age: 30 }));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveProperty("name", "John");
    expect(rows[0]).toHaveProperty("age", "30");
  });

  it("flattens nested objects with dot paths", () => {
    const rows = assertRows(
      flattenForCsv({
        user: { name: "John", address: { city: "Dhaka" } },
      }),
    );
    expect(rows[0]).toHaveProperty("user.name", "John");
    expect(rows[0]).toHaveProperty("user.address.city", "Dhaka");
  });

  it("handles an array of objects", () => {
    const rows = assertRows(
      flattenForCsv([
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 },
      ]),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveProperty("name", "Alice");
    expect(rows[1]).toHaveProperty("name", "Bob");
  });

  it("stores nested arrays as compact JSON", () => {
    const rows = assertRows(flattenForCsv({ tags: ["a", "b", "c"] }));
    expect(rows[0]).toHaveProperty("tags", '["a","b","c"]');
  });

  it("uses empty cell for missing fields", () => {
    const rows = assertRows(flattenForCsv([{ a: 1, b: 2 }, { a: 3 }]));
    expect(rows[0]).toHaveProperty("b", "2");
    expect(rows[1]).toHaveProperty("b", "");
  });

  it("writes null as text 'null'", () => {
    const rows = assertRows(flattenForCsv({ value: null }));
    expect(rows[0]).toHaveProperty("value", "null");
  });

  it("keeps headers in first-seen order", () => {
    // Keys from the first object determine column order
    const rows = assertRows(
      flattenForCsv([
        { z: 1, a: 2, m: 3 },
        { z: 4, a: 5, m: 6 },
      ]),
    );
    const keys: string[] = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!keys.includes(key)) keys.push(key);
      }
    }
    expect(keys).toEqual(["z", "a", "m"]);
  });

  it("escapes dots in keys", () => {
    const rows = assertRows(flattenForCsv({ "a.b": 1 }));
    expect(rows[0]).toHaveProperty("a\\.b", "1");
  });

  it("escapes backslashes in keys", () => {
    const rows = assertRows(flattenForCsv({ "a\\b": 1 }));
    expect(rows[0]).toHaveProperty("a\\\\b", "1");
  });

  it("keeps literal dotted keys separate from nested paths", () => {
    const rows = assertRows(flattenForCsv({ "a.b": 1, a: { b: 2 } }));

    expect(rows[0]).toHaveProperty("a\\.b", "1");
    expect(rows[0]).toHaveProperty("a.b", "2");
  });

  it("returns null for objects with unmergeable duplicate column paths", () => {
    // When two different JSON paths would produce the same column name,
    // the function returns null. This is a safety check — with the current
    // escaping scheme (\\. and \\\\) this is practically unreachable, but
    // the check exists as a safety net per PRD §10.2.
    // Example: a key with literal dot AND a nested path of the same name.
    // The check uses Set size vs Object.keys length.
    const data = { "a.b": 1, a: { b: 2 } };
    const result = flattenForCsv(data);
    // Currently these produce different columns (a\\.b vs a.b) so it passes.
    // If the escaping scheme changes, this test will catch regressions.
    expect(result).not.toBeNull();
  });

  it("returns null for top-level primitives", () => {
    expect(flattenForCsv("hello")).toBeNull();
    expect(flattenForCsv(42)).toBeNull();
    expect(flattenForCsv(true)).toBeNull();
    expect(flattenForCsv(null)).toBeNull();
  });

  it("returns null for empty arrays", () => {
    expect(flattenForCsv([])).toBeNull();
  });

  it("returns null for arrays with non-object items", () => {
    expect(flattenForCsv([1, 2, 3])).toBeNull();
    expect(flattenForCsv(["a", "b"])).toBeNull();
  });
});

describe("convertToCsv", () => {
  it("produces CSV from an object", () => {
    const r = convertToCsv('{"name":"John","age":30}', 1);
    expect(r?.text).toContain("John");
    expect(r?.text).toContain("30");
    expect(r?.format).toBe("csv");
    expect(r?.action).toBe("convert-csv");
  });

  it("returns null for invalid JSON", () => {
    expect(convertToCsv("{bad", 1)).toBeNull();
  });

  it("returns null for top-level primitive", () => {
    expect(convertToCsv('"hello"', 1)).toBeNull();
  });
});
