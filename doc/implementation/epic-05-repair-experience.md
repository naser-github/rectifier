# Epic 05: Repair Experience Execution Plan

> **Required workflow:** Repair-Sensitive UI workflow from
> `doc/agent-workflow.md`.

**Goal:** Let users understand and control safe, ambiguous, and unsupported
repairs without changing the protected original input.

**Exit milestone:** Repair UX Approved

## Why This Epic Exists

Even a technically verified repair needs clear user control. A safe repair must
be previewed before acceptance. Ambiguous repairs must show separate choices
without selecting one. Unsupported cases must guide the user back to manual
editing.

## Scope

- Repair-flow state adapter.
- Safe repair preview dialog.
- Ambiguous repair choice dialog.
- Manual-edit path.
- Syntax edit explanations and previews.
- Tests proving original input protection.

## Out of Scope

- Repair rule implementation.
- Action dock layout and final workspace assembly.
- Free-text repair instructions.

## Dependencies and References

- Requires Core Workspace Ready and Repair Safety Approved.
- Read: PRD sections 4.1-4.4, 8, and the Repair Dialog subsection under 5.4.

## Owned Files

```text
src/hooks/useRepairFlow.ts
src/components/errors/RepairPreviewDialog.tsx
src/components/errors/RepairChoiceDialog.tsx
src/components/errors/RepairManualGuidance.tsx
tests/components/RepairFlow.test.tsx
```

Changes to repair contracts, the worker, shared UI primitives, `App.tsx`, or
the final Action Dock require Orchestrator approval.

## Execution Policy

### Entry Gate

- Repair engine and worker adapter have Repair Safety approval.
- Workspace reducer exposes accepted repair-flow actions.
- Shared Dialog and Button primitives are accepted.

### Safety and UX Policy

- Never modify original input.
- Never apply any candidate before explicit user acceptance.
- Never preselect an ambiguous candidate.
- Show only candidates already verified by the repair engine.
- Show plain explanations and visible syntax changes.
- Do not add a free-text instruction box.

### Review and Completion Policy

Repair Safety and UI Reviewers must approve. Repair UX Approved requires
component tests proving protected input and explicit user choice for every
repair outcome.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
specialist Reviewer executions. The Orchestrator refines usage and cost before
each task starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 05.1 Implement Safe Repair Preview | 100k-170k | Up to 55k | Low | Repair-sensitive UI flow with Repair Safety and UI review |
| 05.2 Implement Ambiguous Repair Choices | 105k-185k | Up to 65k | Low | Complex explicit-choice flow with safety and accessibility review |
| 05.3 Implement Manual Guidance | 55k-100k | Up to 30k | Medium | Focused manual path and disabled-reason behavior |
| 05.4 Perform Repair UX Safety Audit | 80k-135k | Up to 50k | Low | Full repair UX review and likely accepted rework |
| **Epic Total** | **340k-590k** | **Up to 200k** | **Low** | **Every task combines repair safety and user-facing behavior** |

## Tasks

### Task 05.1: Implement Safe Repair Preview

- [ ] Write a failing test that requires before, after, explanation, syntax
  change highlights, Accept, and Reject.
- [ ] Open the preview only for one verified safe candidate.
- [ ] After Accept, apply the candidate through the worker against the same
  source revision, validate the complete repaired JSON again, and create a
  result only after validation succeeds.
- [ ] Reject acceptance when the source revision became stale.
- [ ] Close without creating a result after Reject.
- [ ] Confirm both paths preserve original input.

### Task 05.2: Implement Ambiguous Repair Choices

- [ ] Write tests requiring two or more separate candidate cards.
- [ ] State clearly that Rectifier cannot choose the intended meaning.
- [ ] Show structure and syntax-change preview for each candidate.
- [ ] Require the user to select one card before Apply selected fix is enabled.
- [ ] Do not choose a default candidate.
- [ ] Apply the confirmed candidate through the worker against the same source
  revision, validate the complete repaired JSON again, and create only a result
  after validation succeeds.
- [ ] Reject confirmation when the source revision became stale.

### Task 05.3: Implement Manual Guidance

- [ ] Keep Repair JSON disabled for unsupported input and show its manual-edit
  reason through DisabledReason.
- [ ] Show Edit manually inside an ambiguous choice flow.
- [ ] Show manual guidance when user-triggered full analysis finds no verified
  candidate even though eligibility classification allowed the click.
- [ ] Close any open repair dialog and clear its state immediately when the
  input revision changes.
- [ ] Close the dialog and focus the relevant input error when manual editing is
  selected.
- [ ] Keep unsupported input and all user data unchanged.

### Task 05.4: Perform Repair UX Safety Audit

- [ ] Test safe, ambiguous, manual, reject, and cancel flows.
- [ ] Test complete post-confirmation validation and stale-revision refusal for
  safe and ambiguous acceptance.
- [ ] Test keyboard navigation and focus return for both dialogs.
- [ ] Add a regression test for every Repair Safety finding.
- [ ] Obtain explicit Repair Safety Reviewer approval.

## Verification

```bash
npm test -- --run tests/components/RepairFlow.test.tsx
npm run typecheck
```

Expected result: no repair changes original input, and ambiguous repair cannot
continue until the user explicitly selects a verified choice.

## Acceptance Checklist

- [ ] Safe repair always shows a preview.
- [ ] Safe repair requires Accept.
- [ ] Ambiguous repair never has a default choice.
- [ ] Manual guidance returns focus to input.
- [ ] Cancel and Reject preserve all existing state correctly.
- [ ] Dialogs are keyboard accessible.
- [ ] Repair Safety Reviewer approves.
- [ ] UI Reviewer approves repair dialogs and focus behavior.

## Handoff to Later Epics

Provide the repair-flow component API, accepted action eligibility, dialog focus
behavior, and integration notes. Epic 08 will place Repair JSON at the end of
the central Action Dock.
