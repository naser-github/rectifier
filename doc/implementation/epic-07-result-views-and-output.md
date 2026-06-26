# Epic 07: Result Views and Output Execution Plan

> **Required workflow:** UI Feature workflow from `doc/agent-workflow.md`.

**Goal:** Let users inspect, edit, collapse, copy, and download the exact current
result without rendering large JSON trees all at once.

**Exit milestone:** Result Experience Ready

## Why This Epic Exists

Generated results need more than plain text. JSON users must be able to inspect
large nested data through Code, Tree, and Object views. Converted formats need
an exact Code view. Copy and Download must always use the current result, not a
stale or reconstructed value.

## Scope

- Editable Code result view with CodeMirror folding.
- Virtualized collapsible Tree and Object views.
- Result revalidation after editing.
- Exact Copy and Download.
- Result action eligibility and disabled reasons.

## Out of Scope

- Producing formatted or converted results.
- Repair choice dialogs.
- Final workspace layout.

## Dependencies and References

- Requires Core Workspace Ready.
- Read: the Result Panel subsection under PRD section 5.4, plus sections 12,
  13, 15, and 16.

## Owned Files

```text
src/components/editor/ResultEditor.tsx
src/components/result/CodeResultView.tsx
src/components/result/TreeResultView.tsx
src/components/result/ObjectResultView.tsx
src/components/result/ResultPanel.tsx
src/components/result/treeRows.ts
src/hooks/useDownload.ts
tests/components/ResultPanel.test.tsx
tests/components/TreeResultView.test.tsx
tests/components/ObjectResultView.test.tsx
```

Workspace contract or worker protocol changes require Orchestrator approval.

## Execution Policy

### Entry Gate

- ResultDocument and workspace result actions are accepted.
- Shared controls and disabled-reason behavior are available.
- Orchestrator confirms no file overlap with other active feature epics.

### Result Integrity Policy

- Copy and Download use exact current result text.
- JSON result edits must be validated before updating structured views.
- Converted formats stay in Code view.
- Invalid edited JSON disables Tree and Object with a clear reason.
- Large structured views render only visible expanded rows.

### Review and Completion Policy

UI Reviewer must approve. Result Experience Ready requires exact-output,
edit-validation, collapse, virtualization, keyboard, and download tests to
pass.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
specialist Reviewer executions. The Orchestrator refines usage and cost before
each task starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 07.1 Implement Editable Code Result View | 80k-135k | Up to 40k | Low | CodeMirror, worker validation, structured-view state, and UI review |
| 07.2 Implement Collapsible Virtualized Tree View | 105k-180k | Up to 60k | Low | Virtualization, stable rows, keyboard behavior, and UI review |
| 07.3 Implement Collapsible Object View | 85k-150k | Up to 45k | Low | Nested rendering, collapse behavior, and UI review |
| 07.4 Implement Exact Copy and Download | 60k-105k | Up to 35k | Medium | Browser boundaries, exact-output tests, and UI review |
| **Epic Total** | **330k-570k** | **Up to 180k** | **Low** | **Structured views and virtualization have high UI rework risk** |

## Tasks

### Task 07.1: Implement Editable Code Result View

- [x] Test JSON and converted result display.
- [x] Use CodeMirror with JSON folding for JSON results.
- [x] Use a matching language mode when available for converted output.
- [x] Send edited JSON results through the ephemeral worker validation request
  without replacing the protected source-document revision.
- [x] Update Tree and Object only after edited JSON becomes valid.
- [x] Explain why structured views are unavailable for invalid JSON or
  converted formats.

### Task 07.2: Implement Collapsible Virtualized Tree View

- [x] Convert valid JSON to stable visible-row records.
- [x] Flatten only expanded nodes.
- [x] Keep collapsed-node IDs outside rendered row components.
- [x] Show `{…}` and `[…]` markers for collapsed structures.
- [x] Use `@tanstack/react-virtual` so large arrays do not render every item.
- [x] Test collapse, expand, keyboard activation, and stable row identity.

### Task 07.3: Implement Collapsible Object View

- [x] Present object-oriented nested structures separately from Tree view.
- [x] Share row-generation logic without duplicating view-specific markup.
- [x] Support collapse and expand for objects and arrays.
- [x] Virtualize visible rows.
- [x] Test deeply nested objects and large arrays.

### Task 07.4: Implement Exact Copy and Download

- [x] Keep actions disabled until a result exists.
- [x] Copy exact current result text.
- [x] Download exact current result text.
- [x] Use `.json`, `.yaml`, `.xml`, or `.csv` based on result format.
- [x] Create and revoke local object URLs.
- [x] Show brief success feedback without exposing document content.

## Verification

```bash
npm test -- --run tests/components/ResultPanel.test.tsx \
  tests/components/TreeResultView.test.tsx \
  tests/components/ObjectResultView.test.tsx
npm run typecheck
npm run build
```

Expected result: all result actions use current text, structured views collapse
correctly, and large data is virtualized.

## Acceptance Checklist

- [x] Code view is editable and foldable.
- [x] Tree and Object views require valid JSON.
- [x] Converted results remain in Code view.
- [x] Nested objects and arrays are collapsible.
- [x] Large views render only visible rows.
- [x] Copy and Download use exact current result.
- [x] UI Reviewer approves Code, Tree, Object, Copy, and Download behavior.

## Handoff to Later Epics

Provide ResultPanel composition, supported view states, action eligibility,
exact-output behavior, and performance notes. Epic 08 will place these controls
according to the approved prototype.
