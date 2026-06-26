# Epic 04: Core Workspace and Shared UI Execution Plan

> **Required workflow:** Normal implementation workflow, with Repair Safety
> review for repair-state tasks and UI Feature review for shared controls and
> InputPanel tasks.

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

Code Reviewer approval is required for Tasks 04.1 and 04.4. Repair Safety
Reviewer approval is required for Tasks 04.1, 04.3, and 04.5 because they own
repair state, eligibility, or integration. UI Reviewer approval is required for
Tasks 04.2, 04.3, and 04.5 because they create shared controls, disabled
reasons, and the InputPanel. Core Workspace Ready requires state-transition,
accessibility, persistence, and sample behavior tests to pass before parallel
feature epics begin.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
specialist Reviewer executions. The Orchestrator refines usage and cost before
each task starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 04.1 Define the Workspace State Machine | 110k-190k | Up to 50k | Low | Shared state contract with Code and Repair Safety review |
| 04.2 Build Shared Interface Primitives | 90k-155k | Up to 45k | Low | Multiple accessible primitives with component and UI review |
| 04.3 Implement Disabled Reasons | 70k-120k | Up to 35k | Medium | Focused shared behavior with accessibility and safety review |
| 04.4 Implement First-Visit Sample and Persistence | 85k-140k | Up to 40k | Medium | Storage boundary, reducer behavior, failure tests, and Code review |
| 04.5 Perform Base Integration | 90k-155k | Up to 50k | Low | State, worker, shared UI, safety, and UI integration |
| **Epic Total** | **445k-760k** | **Up to 220k** | **Low** | **Shared contracts and integration affect later parallel epics** |

## Tasks

### Task 04.1: Define the Workspace State Machine

- [x] Write failing reducer tests for input revisions, validation state,
  diagnostics, repair analysis, results, schema state, and mobile panel.
- [x] Define explicit actions for input change, clear, validation response,
  result creation, result edit, repair state, schema result, and panel change.
- [x] Prevent stale worker responses from updating workspace state.
- [x] Clear dependent state when input changes.
- [x] Keep original input separate from generated result.

### Task 04.2: Build Shared Interface Primitives

- [x] Test button, icon-button, dialog, panel, tooltip, and toast behavior.
- [x] Use composition instead of large configuration objects.
- [x] Apply small sharp radiuses, thin borders, and accessible focus styles.
- [x] Give icon-only controls accessible labels and tooltips.
- [x] Keep feature-specific behavior outside `components/ui/`.

### Task 04.3: Implement Disabled Reasons

- [x] Test explanations on pointer hover and keyboard focus.
- [x] Use a focusable wrapper because native disabled buttons do not receive
  reliable focus or hover events.
- [x] Connect the visible reason to the control through accessible description.
- [x] Centralize action eligibility and reason text from workspace state.
- [x] Enable Repair JSON only for invalid input whose eligibility metadata says
  a supported repair rule may apply.
- [x] Disable Repair JSON for valid input and unsupported invalid input with
  the exact reason.

### Task 04.4: Implement First-Visit Sample and Persistence

- [x] Load the PRD nested sample only when no saved workspace exists.
- [x] Label the initial sample as Example JSON.
- [x] Remove example state after edit, upload, or clear.
- [x] Never restore the sample over saved or user-provided input.
- [x] Save input, result text, result format, and schema text when used.
- [x] Save only the latest workspace after an idle delay.
- [x] Replace old saved work and continue normally when IndexedDB is
  unavailable.
- [x] Provide a Clear saved workspace action that removes persisted work
  without reloading the first-visit sample into the active workspace.
- [x] Test save, replace, restore, storage failure, first-visit sample, active
  clear, and Clear saved workspace behavior.

### Task 04.5: Perform Base Integration

- [x] Build InputPanel using the accepted InputEditor, upload behavior, and
  shared icon controls with tooltips.
- [x] Test Upload and Clear controls, tooltips, clear-workspace request, and
  complete reducer reset through InputPanel.
- [x] Connect Clear to one reducer transition that resets input, diagnostics,
  repair state, and result without reloading the first-visit sample.
- [x] Connect worker validation responses to the reducer through
  `useWorkspaceController.ts`.
- [x] Connect shared disabled reasons to current validation state.
- [x] Verify clear resets all dependent workspace state.
- [x] Record the stable workspace and shared-primitive APIs for Epics 05-08.

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

- [x] One reducer owns workspace transitions.
- [x] Original input and generated result remain separate.
- [x] Shared UI primitives are reusable and accessible.
- [x] Every disabled action can expose a reason.
- [x] First-visit sample follows PRD rules.
- [x] Only the latest workspace is persisted.
- [x] Users can clear saved workspace data.
- [x] Code Reviewer approves state and persistence tasks.
- [x] Repair Safety Reviewer approves repair-state and eligibility tasks.
- [x] UI Reviewer approves shared controls, disabled reasons, and InputPanel.

## Handoff to Later Epics

Provide the accepted workspace action API, action-eligibility selectors,
primitive component APIs, and integration ownership rule. Epics 05, 06, and 07
may then execute in parallel without editing the same files.
