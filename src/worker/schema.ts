import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { Diagnostic } from "../domain/diagnostics";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export interface SchemaValidationResult {
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * Validates a JSON instance against a JSON Schema using Ajv.
 *
 * Returns a list of diagnostics. An empty list means the instance is valid
 * against the schema.
 */
export function validateJsonSchema(
  instanceText: string,
  schemaText: string,
): SchemaValidationResult {
  const diagnostics: Diagnostic[] = [];

  let schema: unknown;
  try {
    schema = JSON.parse(schemaText) as unknown;
  } catch {
    return {
      diagnostics: [
        {
          code: "schema.invalid",
          message: "The schema is not valid JSON.",
          position: { offset: 0, line: 1, column: 1 },
          reliability: "confirmed",
          repairState: "not-applicable",
          severity: "error",
        },
      ],
    };
  }

  let instance: unknown;
  try {
    instance = JSON.parse(instanceText) as unknown;
  } catch {
    return {
      diagnostics: [
        {
          code: "schema.invalid-instance",
          message:
            "The input JSON is not valid. Fix syntax errors before checking the schema.",
          position: { offset: 0, line: 1, column: 1 },
          reliability: "confirmed",
          repairState: "not-applicable",
          severity: "error",
        },
      ],
    };
  }

  try {
    const validate = ajv.compile(schema as Record<string, unknown>);
    const valid = validate(instance);

    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        const path = err.instancePath || "/";
        diagnostics.push({
          code: `schema.${err.keyword}`,
          message: `${err.message ?? "Validation error"} at ${path}`,
          position: { offset: 0, line: 1, column: 1 },
          reliability: "confirmed",
          repairState: "not-applicable",
          severity: "error",
        });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown schema error";
    diagnostics.push({
      code: "schema.error",
      message: `Schema compilation error: ${message}`,
      position: { offset: 0, line: 1, column: 1 },
      reliability: "confirmed",
      repairState: "not-applicable",
      severity: "error",
    });
  }

  return { diagnostics };
}
