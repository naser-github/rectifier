# Epic 03: Worker and Validation Execution Plan

> **Required workflow:** Normal workflow, with UI Feature review for editor and
> error-tray tasks and Repair Safety review for repair worker tasks.

**Goal:** Build revision-based background processing, strict automatic
validation, input upload and clear behavior, and precise error navigation.

**Exit milestone:** Validation Pipeline Ready

## Why This Epic Exists

Rectifier must process large input without blocking the interface or showing
stale results. Validation is also the entry point for every later action. This
epic creates one trusted path from editor input to worker diagnostics and
repair analysis.

## Scope

- One Web Worker and typed worker client.
- Revision and job tracking.
- Strict automatic JSON validation.
- 10 MB input limit.
- Input CodeMirror editor.
- Upload and clear behavior contracts, diagnostics tray, first-error focus, and
  red error caret.
- Worker adapter for the already-approved pure repair engine.

## Out of Scope

- Repair choice and preview dialogs.
- Formatting, conversion, schema, and result views.
- Final workspace polish.

## Dependencies and References

- Requires Repair Safety Approved.
- Read: PRD sections 6, 7, 8.1, 13, 15, and 17.

## Owned Files

```text
src/worker/json.worker.ts
src/worker/diagnostics.ts
src/hooks/useWorkerClient.ts
src/hooks/useAutoValidation.ts
src/components/editor/InputEditor.tsx
src/components/editor/errorDecorations.ts
src/components/errors/ErrorTray.tsx
src/lib/files.ts
src/lib/size.ts
tests/worker/protocol.test.ts
tests/worker/diagnostics.test.ts
tests/components/InputEditor.test.tsx
```

Worker protocol contract changes require Orchestrator approval.

## Execution Policy

### Entry Gate

- Epics 01 and 02 pass all verification.
- Repair API and worker protocol contracts are accepted.
- Worker and editor file ownership is exclusive.

### Processing Policy

- Send full input once per revision.
- Send later actions using only the accepted revision.
- Ignore old jobs and revisions.
- Keep expensive validation and repair analysis off the main thread.
- Reject files over 10 MB before reading them.
- Do not parse independent JSON chunks.

### Review and Completion Policy

Code Reviewer approval is required for Tasks 03.1, 03.2, 03.4, and 03.5. UI
Reviewer approval is required for Tasks 03.3 and 03.4. The Repair Safety
Reviewer must confirm Tasks 03.1 and 03.5 delegate to the pure engine and do
not bypass its verification. Validation Pipeline Ready requires worker,
diagnostics, editor, size-limit, and stale-response tests to pass.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
specialist Reviewer executions. The Orchestrator refines usage and cost before
each task starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 03.1 Implement Revision-Based Worker Communication | 105k-170k | Up to 50k | Low | Worker lifecycle, stale-response behavior, Code, and Repair Safety review |
| 03.2 Implement Strict Diagnostics | 85k-140k | Up to 40k | Medium | Focused parser diagnostics, tests, and Code review |
| 03.3 Implement Input Size, Upload, and Clear | 60k-100k | Up to 25k | Medium | Browser boundary work, component tests, and UI review |
| 03.4 Implement Automatic Validation and Error Focus | 110k-190k | Up to 50k | Low | Worker, editor, focus, accessibility, Code, and UI review |
| 03.5 Expose Repair Analysis Safely | 110k-190k | Up to 60k | Low | Worker-to-engine safety boundary with Code and Repair Safety review |
| **Epic Total** | **470k-790k** | **Up to 225k** | **Low** | **Worker and UI integration create cross-boundary rework risk** |

## Tasks

### Task 03.1: Implement Revision-Based Worker Communication

- [x] Write failing protocol tests for stale responses, stored revisions,
  unknown revisions, and repair-engine delegation.
- [x] Start one worker and terminate it on application unmount.
- [x] Increase `jobId` for every request and `revision` only for input changes.
- [x] Store the latest document and parse state in the worker.
- [x] Return `stale-revision` for actions against old input.
- [x] Ignore responses from older jobs or revisions in the client.

### Task 03.2: Implement Strict Diagnostics

- [x] Test every valid top-level JSON type.
- [x] Test missing comma, trailing comma, and uncertain follow-on errors.
- [x] Parse with trailing commas and comments disallowed.
- [x] Map confirmed parser errors to plain messages, offsets, lines, and
  columns.
- [x] Do not present possible follow-on diagnostics as confirmed errors.
- [x] Implement ephemeral result-text validation without replacing the stored
  protected source document.

### Task 03.3: Implement Input Size, Upload, and Clear

- [x] Reject selected files larger than 10 MB using `file.size` before reading.
- [x] Reject pasted or typed input as soon as its encoded size exceeds 10 MB
  and keep the last accepted document revision.
- [x] Show a clear 10 MB limit explanation for upload, paste, and typed input.
- [x] Accept `.json` files and send a new document revision immediately.
- [x] Expose upload selection and clear-workspace requests for the Input panel;
  Epic 04 owns the shared icon controls and complete state reset.
- [x] Verify user content never leaves the browser.

### Task 03.4: Implement Automatic Validation and Error Focus

- [x] Configure the input CodeMirror editor with JSON syntax highlighting, line
  numbers, and object/array code folding.
- [x] Test syntax highlighting, line numbers, and folding.
- [x] Debounce normal typing by 300 milliseconds.
- [x] Validate uploaded files immediately.
- [x] Decorate confirmed error ranges in CodeMirror.
- [x] Focus and scroll to the first confirmed error.
- [x] Use a red caret while an error is focused.
- [x] Allow each Error Tray item to focus its exact source location.
- [x] Confirm stale diagnostics never replace current diagnostics.

### Task 03.5: Expose Repair Analysis Safely

- [x] After confirmed invalid diagnostics, call the pure
  `classifyRepairEligibility()` API for the current revision only to return
  supported-rule eligibility metadata.
- [x] Eligibility classification must not generate, verify, select, show,
  preview, or apply a candidate; create a result; or open a dialog.
- [x] Generate and verify candidates only after the user clicks Repair JSON.
- [x] Route user-triggered repair analysis and candidate application to the
  pure repair API.
- [x] Return only the accepted `safe`, `ambiguous`, or `manual` result.
- [x] Add a regression test proving worker handlers contain no repair rules.
- [x] Obtain Repair Safety Reviewer approval.

## Verification

```bash
npm test -- --run tests/worker/protocol.test.ts \
  tests/worker/diagnostics.test.ts \
  tests/components/InputEditor.test.tsx
npm run typecheck
npm run build
```

Expected result: current input receives correct diagnostics, stale work is
ignored, and the worker never bypasses the pure repair engine.

## Acceptance Checklist

- [x] One worker owns expensive processing.
- [x] Automatic validation has no Validate button.
- [x] Files over 10 MB are rejected before reading.
- [x] Pasted and typed input over 10 MB is rejected.
- [x] Input editor supports highlighting, line numbers, and folding.
- [x] Diagnostics include reliable source positions.
- [x] First error receives focus and a red caret.
- [x] Old responses cannot overwrite current state.
- [x] Repair adapter passes Repair Safety review.
- [x] Automatic eligibility classification never generates, applies, or shows
  a repair candidate.
- [x] Code Reviewer approves worker and diagnostics tasks.
- [x] UI Reviewer approves editor, Error Tray, and error-focus behavior.

Provide the accepted worker-client API, validation state shape, diagnostic
focus contract, size-limit behavior, and repair-analysis responses. Epic 04
will use these contracts to own full workspace state.
