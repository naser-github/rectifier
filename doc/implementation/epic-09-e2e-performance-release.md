# Epic 09: E2E, Performance, and Release Execution Plan

> **Required workflow:** Release workflow from `doc/agent-workflow.md`.

**Goal:** Prove the complete browser product, repair safety, 10 MB behavior,
responsiveness, and release instructions.

**Exit milestone:** Release Candidate Approved

## Why This Epic Exists

Unit and component tests cannot prove real workers, CodeMirror, uploads,
downloads, large files, browser storage, and complete user flows together.
This epic provides release evidence and records performance instead of assuming
the product can handle its 10 MB promise.

## Scope

- Complete Playwright user-flow tests.
- Deterministic 1 MB, 5 MB, and 10 MB fixtures.
- Deep nesting, large arrays, and heavily broken JSON tests.
- Responsiveness and stale-result checks.
- Performance and available memory recording.
- Objective release performance budget and evidence report.
- Final run guide and release acceptance audit.

## Out of Scope

- New product features.
- Raising the 10 MB limit.
- Performance claims not supported by recorded browser evidence.

## Dependencies and References

- Requires every earlier epic milestone.
- Read: all PRD acceptance criteria, global safety/performance rules in the
  roadmap, and `doc/agent-workflow.md` Project Completion.

## Owned Files

```text
e2e/rectifier.spec.ts
e2e/performance.spec.ts
tests/fixtures/createLargeJson.ts
doc/RUN.md
README.md
doc/implementation.md
doc/implementation/traceability.md
doc/performance.md
```

Fixes outside these files require a new task brief, exact ownership, focused
regression test, and the reviewers required by the affected epic.

## Execution Policy

### Entry Gate

- Epics 01-08 are accepted.
- Unit tests, type checking, and production build pass before browser testing.
- The release budget in this epic is unchanged unless a product decision is
  recorded before execution.

### Release Testing Policy

- Generate deterministic fixtures during tests; do not commit large random
  files.
- Test current Chromium first, then record any additional browser coverage.
- Treat memory measurement as advisory when the browser does not expose a
  stable heap API.
- Run performance checks on the recorded reference machine using production
  build, current Chromium, no CPU throttle, and no other active test.
- A failed safety test blocks release.
- A functional regression returns to the owning epic through a focused fix
  task and review.
- Do not hide or weaken failing release checks.
- Do not change a release performance budget in response to a failed
  measurement. Any budget change must be an approved product decision recorded
  before Epic 09 execution begins.

### Completion Policy

Release Candidate Approved requires all verification commands, complete
requirements coverage, final safety and UI reviews, performance evidence, and a
verified run guide.

## Tasks

### Task 09.1: Build Full User-Flow Browser Tests

- [ ] Paste valid JSON and Beautify.
- [ ] Upload invalid JSON and focus the first error with red caret.
- [ ] Preview and accept one safe repair.
- [ ] Select one ambiguous repair choice.
- [ ] Refuse unsupported repair and return to manual editing.
- [ ] Convert nested object data to automatically flattened CSV.
- [ ] Run Schema Check separately from the Action Dock.
- [ ] Collapse result objects and arrays.
- [ ] Copy and download exact results.
- [ ] Verify disabled reasons with pointer and keyboard.
- [ ] Restore only the latest workspace.

### Task 09.2: Build Large-File and Responsiveness Tests

- [ ] Generate deterministic valid and supported-invalid 1 MB, 5 MB, and 10 MB
  fixtures.
- [ ] Reject files over 10 MB before reading.
- [ ] Complete validation for a 10 MB valid file.
- [ ] Complete repair analysis for a 10 MB supported-invalid file.
- [ ] Confirm the page remains interactive during worker processing.
- [ ] Confirm stale validation cannot replace current results.
- [ ] Confirm large Tree/Object views do not render every row.

### Task 09.3: Build Adversarial Safety and Stability Tests

- [ ] Test deep nesting without validator or repair-analyzer crash.
- [ ] Test large arrays.
- [ ] Test heavily broken JSON returning reliable errors or manual guidance.
- [ ] Test broken Unicode, invalid escapes, and unterminated strings.
- [ ] Confirm no unsafe repair candidate is produced.
- [ ] Re-run all repair safety fixtures in release verification.

### Task 09.4: Record Performance Evidence

- [ ] Use these release budgets on the recorded reference machine:
  - 10 MB valid JSON validation completes within 5 seconds.
  - 10 MB supported-invalid repair analysis completes within 10 seconds.
  - While either job runs, an enabled UI control responds within 250
    milliseconds.
  - No main-thread long task caused by Rectifier processing exceeds 500
    milliseconds.
- [ ] Record validation time for 1 MB, 5 MB, and 10 MB valid fixtures.
- [ ] Record repair-analysis time for supported invalid fixtures.
- [ ] Record available peak JavaScript heap measurement.
- [ ] Record typing, button, and error-navigation responsiveness.
- [ ] Compare evidence with the agreed budgets and document any accepted limit.
- [ ] Write environment, budgets, measurements, and pass/fail results to
  `doc/performance.md`.

### Task 09.5: Create and Verify the Run Guide

- [ ] Document install, development, typecheck, unit test, build, and Playwright
  commands in `doc/RUN.md`.
- [ ] State clearly that no backend or AI service is required.
- [ ] Run every documented command exactly as written.
- [ ] Update `README.md` to link the run guide only after it is verified.

### Task 09.6: Perform Final Release Audit

- [ ] Complete `doc/implementation/traceability.md` by mapping every BRD
  requirement, BRD business rule, detailed PRD requirement, and PRD acceptance
  criterion to its accepted epic task and passing test or reviewed evidence.
- [ ] Run final Requirements, UI, Repair Safety, Code, and Release reviews.
- [ ] Confirm no unresolved Blocking or Important finding remains.
- [ ] Confirm Epics 01-08 already show Accepted and provide the evidence needed
  for the Orchestrator to mark Epic 09 Accepted after its exit gate.

## Verification

```bash
npm run typecheck
npm test -- --run
npm run build
npx playwright test
```

Expected result: every command passes, safety checks produce no unsafe repair,
and recorded performance supports the 10 MB product promise.

## Acceptance Checklist

- [ ] Complete user flows pass in a real browser.
- [ ] 10 MB validation and supported repair analysis complete.
- [ ] Over-limit files are rejected before reading.
- [ ] Large and adversarial input does not produce unsafe repair.
- [ ] Responsiveness and performance evidence are recorded.
- [ ] Every objective release performance budget passes or a product decision
  explicitly changed the budget before Epic 09 execution began.
- [ ] Run guide commands are verified.
- [ ] Final Requirements, Code, UI, Repair Safety, and Release Reviewers
  approve.
- [ ] Project Orchestrator approves the release candidate.

## Final Handoff

Provide the verified run guide, full test results, performance evidence,
accepted limitations, final reviewer approvals, and release-candidate status.
