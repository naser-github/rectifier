# Epic 04: Core Workspace and Shared UI Execution Plan

> **Required workflow:** Normal implementation workflow from
> `doc/agent-workflow.md`.

**Goal:** Create one predictable workspace state model and the shared interface
primitives that every product feature will use.

**Exit milestone:** Core Workspace Ready

## Why This Epic Exists

Repair, conversion, result views, schema checks, and responsive layout all need
the same input, diagnostics, result, and action state. Without one reducer and
shared accessible controls, later feature epics would duplicate behavior and
conflict during integration.

## Scope

- Workspace domain state and reducer.
- Shared Button, IconButton, Panel, Dialog, Tooltip, DisabledReason, and Toast.
- Accessible disabled-action explanations.
- Latest-workspace IndexedDB persistence.
- First-visit nested sample behavior.
- Base application composition used by later features.

## Out of Scope

- Feature-specific repair dialogs.
- Conversion and schema implementations.
- Result Tree/Object views.
- Final approved layout and responsive polish.

## Dependencies and References

- Requires Validation Pipeline Ready.
- Read: PRD sections 6.3-6.4, 13, 14, 16, and 17.

## Owned Files

```text
src/domain/workspace.ts
src/state/workspaceReducer.ts
src/hooks/useWorkspacePersistence.ts
src/hooks/useWorkspaceController.ts
src/lib/sampleJson.ts
src/components/ui/Button.tsx
src/components/ui/Dialog.tsx
src/components/ui/DisabledReason.tsx
src/components/ui/IconButton.tsx
src/components/ui/Panel.tsx
src/components/ui/Toast.tsx
src/components/ui/Tooltip.tsx
src/components/editor/InputPanel.tsx
tests/state/workspaceReducer.test.ts
tests/hooks/useWorkspacePersistence.test.ts
tests/components/InputPanel.test.tsx
tests/components/ui/
```

`src/app/App.tsx` may be modified only by an Orchestrator-owned integration
task. Feature epics must not independently modify it.

## Execution Policy

### Entry Gate

- Worker client, validation state, and diagnostic contracts are accepted.
- Orchestrator approves the initial workspace state contract.
- Shared UI primitive APIs are kept small and behavior-focused.

### State and Component Policy

- Keep one reducer as the source of truth for workspace transitions.
- Store only state required by the product.
- Do not put parsing, repair, conversion, or schema logic in the reducer or UI
  components.
- Create a shared primitive only when at least two real uses share behavior.
- Disabled actions must explain their reason on hover and keyboard focus.
- Persistence failure must never stop core product behavior.

### Review and Completion Policy

Requirements and Code Reviewers must approve. Core Workspace Ready requires
state-transition, accessibility, persistence, and sample behavior tests to
pass before parallel feature epics begin.

## Tasks

### Task 04.1: Define the Workspace State Machine

- [ ] Write failing reducer tests for input revisions, validation state,
  diagnostics, repair analysis, results, schema state, and mobile panel.
- [ ] Define explicit actions for input change, clear, validation response,
  result creation, result edit, repair state, schema result, and panel change.
- [ ] Prevent stale worker responses from updating workspace state.
- [ ] Clear dependent state when input changes.
- [ ] Keep original input separate from generated result.

### Task 04.2: Build Shared Interface Primitives

- [ ] Test button, icon-button, dialog, panel, tooltip, and toast behavior.
- [ ] Use composition instead of large configuration objects.
- [ ] Apply small sharp radiuses, thin borders, and accessible focus styles.
- [ ] Give icon-only controls accessible labels and tooltips.
- [ ] Keep feature-specific behavior outside `components/ui/`.

### Task 04.3: Implement Disabled Reasons

- [ ] Test explanations on pointer hover and keyboard focus.
- [ ] Use a focusable wrapper because native disabled buttons do not receive
  reliable focus or hover events.
- [ ] Connect the visible reason to the control through accessible description.
- [ ] Centralize action eligibility and reason text from workspace state.
- [ ] Enable Repair JSON only for invalid input with at least one supported
  safe or ambiguous repair path.
- [ ] Disable Repair JSON for valid input and unsupported invalid input with
  the exact reason.

### Task 04.4: Implement First-Visit Sample and Persistence

- [ ] Load the PRD nested sample only when no saved workspace exists.
- [ ] Label the initial sample as Example JSON.
- [ ] Remove example state after edit, upload, or clear.
- [ ] Never restore the sample over saved or user-provided input.
- [ ] Save input, result text, result format, and schema text when used.
- [ ] Save only the latest workspace after an idle delay.
- [ ] Replace old saved work and continue normally when IndexedDB is
  unavailable.
- [ ] Provide a Clear saved workspace action that removes persisted work
  without reloading the first-visit sample into the active workspace.
- [ ] Test save, replace, restore, storage failure, first-visit sample, active
  clear, and Clear saved workspace behavior.

### Task 04.5: Perform Base Integration

- [ ] Build InputPanel using the accepted InputEditor, upload behavior, and
  shared icon controls with tooltips.
- [ ] Test Upload and Clear controls, tooltips, clear-workspace request, and
  complete reducer reset through InputPanel.
- [ ] Connect Clear to one reducer transition that resets input, diagnostics,
  repair state, and result without reloading the first-visit sample.
- [ ] Connect worker validation responses to the reducer through
  `useWorkspaceController.ts`.
- [ ] Connect shared disabled reasons to current validation state.
- [ ] Verify clear resets all dependent workspace state.
- [ ] Record the stable workspace and shared-primitive APIs for Epics 05-08.

## Verification

```bash
npm test -- --run tests/state/workspaceReducer.test.ts \
  tests/hooks/useWorkspacePersistence.test.ts \
  tests/components/InputPanel.test.tsx \
  tests/components/ui
npm run typecheck
```

Expected result: workspace transitions are deterministic, disabled reasons are
accessible, and storage failure does not break the app.

## Acceptance Checklist

- [ ] One reducer owns workspace transitions.
- [ ] Original input and generated result remain separate.
- [ ] Shared UI primitives are reusable and accessible.
- [ ] Every disabled action can expose a reason.
- [ ] First-visit sample follows PRD rules.
- [ ] Only the latest workspace is persisted.
- [ ] Users can clear saved workspace data.
- [ ] Requirements and Code Reviewers approve.

## Handoff to Later Epics

Provide the accepted workspace action API, action-eligibility selectors,
primitive component APIs, and integration ownership rule. Epics 05, 06, and 07
may then execute in parallel without editing the same files.
