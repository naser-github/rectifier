import { describe, expect, it } from "vitest";

import { validateJsonSchema } from "../../src/worker/schema";

describe("validateJsonSchema", () => {
  it("returns empty diagnostics for valid instance against valid schema", () => {
    const result = validateJsonSchema(
      '{"name":"John","age":30}',
      '{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"number"}},"required":["name","age"]}',
    );

    expect(result.diagnostics).toHaveLength(0);
  });

  it("returns a diagnostic when the instance has a type error", () => {
    const result = validateJsonSchema(
      '{"name":42}',
      '{"type":"object","properties":{"name":{"type":"string"}}}',
    );

    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0]?.message).toMatch(/must be string/i);
  });

  it("returns a diagnostic for invalid schema JSON", () => {
    const result = validateJsonSchema("{}", "{bad");

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain("not valid JSON");
  });

  it("returns a diagnostic for invalid instance JSON", () => {
    const result = validateJsonSchema("{bad", "{}");

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain("not valid");
  });

  it("returns a diagnostic for missing required property", () => {
    const result = validateJsonSchema("{}", '{"type":"object","required":["name"]}');

    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0]?.message).toContain("required");
  });

  it("never changes the current input or result — only sets diagnostics", () => {
    const result = validateJsonSchema('{"name":"John"}', '{"type":"object"}');
    // Schema validation returns diagnostics, not a result document or input change
    expect(result).toHaveProperty("diagnostics");
    expect(Object.keys(result)).toEqual(["diagnostics"]);
  });

  it("uses plain messages with data paths", () => {
    const result = validateJsonSchema(
      '{"user":{"age":"not-a-number"}}',
      '{"type":"object","properties":{"user":{"type":"object","properties":{"age":{"type":"number"}}}}}',
    );

    expect(result.diagnostics.length).toBeGreaterThan(0);
    // Messages should reference the path
    const msg = result.diagnostics[0]?.message.toLowerCase() ?? "";
    expect(msg).toContain("/user/age");
  });
});
