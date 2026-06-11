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

Requirements, Code, and UI Reviewers must approve. Result Experience Ready
requires exact-output, edit-validation, collapse, virtualization, keyboard, and
download tests to pass.

## Tasks

### Task 07.1: Implement Editable Code Result View

- [ ] Test JSON and converted result display.
- [ ] Use CodeMirror with JSON folding for JSON results.
- [ ] Use a matching language mode when available for converted output.
- [ ] Send edited JSON results through the ephemeral worker validation request
  without replacing the protected source-document revision.
- [ ] Update Tree and Object only after edited JSON becomes valid.
- [ ] Explain why structured views are unavailable for invalid JSON or
  converted formats.

### Task 07.2: Implement Collapsible Virtualized Tree View

- [ ] Convert valid JSON to stable visible-row records.
- [ ] Flatten only expanded nodes.
- [ ] Keep collapsed-node IDs outside rendered row components.
- [ ] Show `{…}` and `[…]` markers for collapsed structures.
- [ ] Use `@tanstack/react-virtual` so large arrays do not render every item.
- [ ] Test collapse, expand, keyboard activation, and stable row identity.

### Task 07.3: Implement Collapsible Object View

- [ ] Present object-oriented nested structures separately from Tree view.
- [ ] Share row-generation logic without duplicating view-specific markup.
- [ ] Support collapse and expand for objects and arrays.
- [ ] Virtualize visible rows.
- [ ] Test deeply nested objects and large arrays.

### Task 07.4: Implement Exact Copy and Download

- [ ] Keep actions disabled until a result exists.
- [ ] Copy exact current result text.
- [ ] Download exact current result text.
- [ ] Use `.json`, `.yaml`, `.xml`, or `.csv` based on result format.
- [ ] Create and revoke local object URLs.
- [ ] Show brief success feedback without exposing document content.

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

- [ ] Code view is editable and foldable.
- [ ] Tree and Object views require valid JSON.
- [ ] Converted results remain in Code view.
- [ ] Nested objects and arrays are collapsible.
- [ ] Large views render only visible rows.
- [ ] Copy and Download use exact current result.
- [ ] Requirements and Code Reviewers approve.
- [ ] UI Reviewer approves Code, Tree, Object, Copy, and Download behavior.

## Handoff to Later Epics

Provide ResultPanel composition, supported view states, action eligibility,
exact-output behavior, and performance notes. Epic 08 will place these controls
according to the approved prototype.
