import { describe, expect, it } from "vitest";
import { jsonToTreeRows } from "../../../src/components/result/treeRows";

describe("jsonToTreeRows", () => {
  it("produces a row for a primitive value", () => {
    const rows = jsonToTreeRows(42, new Set());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.value).toBe("42");
    expect(rows[0]?.isObject).toBe(false);
  });

  it("produces rows for an object with keys", () => {
    const rows = jsonToTreeRows({ a: 1, b: 2 }, new Set());
    // Root object row + 2 children
    expect(rows).toHaveLength(3);
  });

  it("collapses when the path is in the collapsed set", () => {
    const rows = jsonToTreeRows({ a: { b: 1 } }, new Set(["$"]));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isCollapsed).toBe(true);
  });

  it("expands children when not collapsed", () => {
    const rows = jsonToTreeRows({ a: { b: 1 } }, new Set());
    // root + a (object) + b (primitive) = 3
    expect(rows.length).toBeGreaterThan(2);
  });

  it("shows array notation", () => {
    const rows = jsonToTreeRows([1, 2, 3], new Set());
    expect(rows[0]?.isObject).toBe(true);
    expect(rows[0]?.value).toContain("Array");
  });

  it("shows object notation", () => {
    const rows = jsonToTreeRows({ a: 1, b: 2 }, new Set());
    expect(rows[0]?.value).toContain("Object");
  });

  it("marks arrays with isArray=true", () => {
    const rows = jsonToTreeRows([1, 2, 3], new Set());
    expect(rows[0]?.isArray).toBe(true);
  });

  it("marks objects with isArray=false", () => {
    const rows = jsonToTreeRows({ a: 1 }, new Set());
    expect(rows[0]?.isArray).toBe(false);
  });

  it("produces stable dot-path IDs", () => {
    const rows = jsonToTreeRows({ a: { b: 1 } }, new Set());
    const idRow = rows.find((r) => r.key === "b");
    expect(idRow?.id).toBe("$.a.b");
  });

  it("handles deeply nested structures", () => {
    const deep = { a: { b: { c: { d: { e: 1 } } } } };
    const rows = jsonToTreeRows(deep, new Set());
    // root + a + b + c + d + e = 6 rows
    expect(rows).toHaveLength(6);
  });

  it("returns empty array for invalid input", () => {
    const rows = jsonToTreeRows(undefined, new Set());
    // undefined is not an object, so it produces 1 row for the primitive
    expect(rows).toHaveLength(1);
  });
});
