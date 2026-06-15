# Epic 06: Format, Convert, and Schema Execution Plan

> **Required workflow:** Normal implementation workflow, with UI Feature review
> for Schema Drawer tasks.

**Goal:** Add deterministic formatting, YAML/XML/CSV conversion, automatic
nested JSON flattening for CSV, and separate JSON Schema checking.

**Exit milestone:** Processing Tools Ready

## Why This Epic Exists

These actions all require valid JSON but produce different output or analysis.
They belong in the worker so large input does not block the interface. CSV
needs a strict flattening contract so nested data produces predictable columns
without silently merging paths.

## Scope

- Beautify and Minify.
- YAML, XML, and CSV conversion.
- Escaped dot-path nested-object flattening for CSV.
- Schema worker processing and Schema Drawer.
- Plain conversion and schema diagnostics.

## Out of Scope

- Repair.
- Result Code/Tree/Object rendering.
- Final action-dock and workspace layout.

## Dependencies and References

- Requires Core Workspace Ready.
- Read: PRD sections 9, 10, 11, 13, 15, and 17.

## Owned Files

```text
src/worker/converters.ts
src/worker/schema.ts
src/worker/json.worker.ts
src/hooks/useWorkerClient.ts
src/hooks/useProcessingActions.ts
src/lib/formats.ts
src/components/schema/SchemaDrawer.tsx
tests/worker/protocol.test.ts
tests/worker/converters.test.ts
tests/worker/schema.test.ts
tests/components/SchemaDrawer.test.tsx
```

Epic 01 owns the accepted processing request and response variants. If
implementation proves a contract defect, use the shared-contract workflow
before changing `src/domain/workerProtocol.ts`.

## Execution Policy

### Entry Gate

- Worker revision protocol and workspace action eligibility are accepted.
- Orchestrator confirms processing files do not overlap with active Epic 05 or
  Epic 07 Workers.
- Epic 01 processing protocol variants are accepted and require no planned
  contract extension.
- If implementation exposes a contract defect, stop all dependent parallel
  work and use the shared-contract workflow before continuing.

### Processing Policy

- Run all parse, format, conversion, flattening, and schema work in the worker.
- Require valid current JSON before valid-only actions.
- Do not change input while producing results.
- Make unsupported CSV shapes fail with a clear reason.
- Keep Schema Check separate from the central Action Dock.

### Review and Completion Policy

Requirements and Code Reviewers must approve. UI Reviewer approval is also
required for Schema Drawer tasks. Processing Tools Ready requires focused
worker tests, schema component tests, type checking, and documented conversion
contracts.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
Reviewer executions. The Orchestrator refines usage and cost before each task
starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 06.1 Implement Beautify and Minify | 80k-140k | Up to 40k | Medium | Small worker actions with focused tests |
| 06.2 Implement YAML and XML Conversion | 120k-210k | Up to 60k | Medium | Two conversion libraries, escaping rules, and tests |
| 06.3 Implement Automatic Flattened CSV | 130k-230k | Up to 70k | Low | New flattening contract, escaping, refusal behavior, and tests |
| 06.4 Implement Schema Check | 130k-230k | Up to 70k | Low | Schema worker behavior plus UI Feature review |
| 06.5 Integrate Processing Actions into the Single Worker | 140k-240k | Up to 80k | Low | Cross-action worker integration and regression risk |
| **Epic Total** | **600k-1,050k** | **Up to 320k** | **Low** | **Conversion and integration behavior has several boundary cases** |

## Tasks

### Task 06.1: Implement Beautify and Minify

- [ ] Test valid objects, arrays, primitives, and invalid input.
- [ ] Use `JSON.stringify(value, null, 2)` for Beautify.
- [ ] Use `JSON.stringify(value)` for Minify.
- [ ] Return a JSON `ResultDocument` without changing source input.

### Task 06.2: Implement YAML and XML Conversion

- [ ] Test objects, arrays, primitives, escaping, and invalid input.
- [ ] Use `js-yaml` for YAML.
- [ ] Use `fast-xml-parser` XMLBuilder for XML.
- [ ] Wrap top-level arrays or primitives in one XML `<root>` element.
- [ ] Return the exact converted result and format.

### Task 06.3: Implement Automatic Flattened CSV

- [ ] Accept one top-level object or a non-empty array of objects.
- [ ] Flatten nested objects using an iterative walker and escaped dot paths.
- [ ] Escape existing `\` and `.` characters in keys.
- [ ] Keep headers in first-seen order.
- [ ] Keep nested arrays as compact JSON in one cell.
- [ ] Use empty cells for missing fields and text `null` for JSON null.
- [ ] Refuse primitives, empty arrays, arrays with non-object rows, and paths
  that cannot remain unique.
- [ ] Pass flattened rows to Papa Parse for correct CSV escaping.

### Task 06.4: Implement Schema Check

- [ ] Test valid schemas, invalid schemas, valid instances, invalid instances,
  and invalid input JSON.
- [ ] Support pasting, editing, and uploading a `.json` schema.
- [ ] Support opening, closing, and clearing the separate Schema Drawer.
- [ ] Compile schemas with Ajv and `ajv-formats`.
- [ ] Map Ajv errors to plain messages and data paths.
- [ ] Keep schema text in the browser.
- [ ] Keep the Schema Drawer separate from the Action Dock.
- [ ] Prove Schema Check never changes the current input or existing result.

### Task 06.5: Integrate Processing Actions into the Single Worker

- [ ] Implement the accepted Beautify, Minify, Convert, and Schema Check worker
  protocol variants defined in Epic 01.
- [ ] Route all processing actions through `json.worker.ts` and
  `useWorkerClient.ts`.
- [ ] Keep one source document per accepted revision and never resend it for
  later processing actions.
- [ ] Add protocol tests for processing responses, stale revisions, and schema
  results that do not replace the current result.

## Verification

```bash
npm test -- --run tests/worker/converters.test.ts \
  tests/worker/schema.test.ts \
  tests/worker/protocol.test.ts \
  tests/components/SchemaDrawer.test.tsx
npm run typecheck
npm run build
```

Expected result: every supported action produces deterministic output and every
unsupported CSV or schema state provides a clear reason.

## Acceptance Checklist

- [ ] Beautify and Minify accept every valid JSON top-level type.
- [ ] YAML and XML output are deterministic.
- [ ] CSV automatically flattens nested objects.
- [ ] Literal and nested path names never silently merge.
- [ ] Nested arrays remain one CSV cell.
- [ ] Schema errors use plain messages and data paths.
- [ ] Schema Drawer opens, closes, clears, and never changes the result.
- [ ] All processing actions use the single revision-based worker.
- [ ] Requirements and Code Reviewers approve.
- [ ] UI Reviewer approves the Schema Drawer behavior.

## Handoff to Later Epics

Provide action eligibility, result formats, CSV refusal reasons, Schema Drawer
API, and conversion timing notes. Epic 08 will place format and conversion
actions in the central dock and Schema Check on the workspace edge.
