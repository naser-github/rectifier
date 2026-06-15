# Epic 08: Product UI, Accessibility, and Responsive Execution Plan

> **Required workflow:** UI Integration workflow from
> `doc/agent-workflow.md`.

**Goal:** Integrate all accepted features into a polished, accessible,
responsive light paper workspace.

**Exit milestone:** UI Acceptance Approved

## Why This Epic Exists

The feature epics intentionally avoid editing the same integration files. This
epic is the controlled integration point. It assembles the full product,
applies the approved visual design, verifies action placement, and handles
desktop and mobile behavior.

## Scope

- Final application composition.
- Header, desktop workspace, mobile switcher, Action Dock, status/error area.
- Approved light design, Prompt font, paper texture, and interaction polish.
- Final action order and control placement.
- Accessibility, responsive behavior, feedback, and browser-content security.

## Out of Scope

- New repair, conversion, schema, or result behavior.
- Dark mode.
- Backend, accounts, analytics, or AI.

## Dependencies and References

- Requires Repair UX Approved, Processing Tools Ready, and Result Experience
  Ready.
- Read all of PRD section 5, plus sections 13, 16, and 17.
- Use `doc/ui/rectifier-light-v1.html` as the visual reference.

## Owned Files

```text
src/app/App.tsx
src/components/actions/ActionDock.tsx
src/components/layout/Header.tsx
src/components/layout/Workspace.tsx
src/components/layout/MobileWorkspaceTabs.tsx
src/styles/global.css
tests/components/Workspace.test.tsx
tests/components/Accessibility.test.tsx
```

Feature implementation files may be changed only to fix an integration defect
approved by the Orchestrator.

## Execution Policy

### Entry Gate

- Epics 05, 06, and 07 are accepted.
- Their public component and hook APIs are recorded.
- No feature Worker remains active in integration-owned files.
- Orchestrator creates an integration task brief listing every permitted file.

### Integration Policy

- Integrate accepted feature APIs; do not rewrite their business logic.
- Follow the PRD when the prototype differs from approved behavior.
- Keep Schema Check separate from the Action Dock.
- Keep Repair JSON as the final central action.
- Use icon-only Upload, Clear, Copy, and Download with tooltips.
- Do not add Load Example or theme-switch controls.
- Render user content as text, never executable HTML.

### Review and Completion Policy

Requirements and Code Reviewers must approve. A final UI Reviewer compares the
running product with the approved prototype and PRD exceptions. UI Acceptance
Approved requires component, accessibility, typecheck, and build verification.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
Reviewer executions. The Orchestrator refines usage and cost before each task
starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 08.1 Assemble the Desktop Workspace | 150k-260k | Up to 80k | Low | Full accepted-feature integration and UI review |
| 08.2 Assemble Actions and Feedback | 120k-210k | Up to 60k | Low | Shared action states, disabled reasons, feedback, and UI review |
| 08.3 Apply the Approved Light Visual System | 140k-240k | Up to 70k | Low | Prototype comparison, token styling, and visual rework |
| 08.4 Implement Mobile and Responsive Behavior | 150k-260k | Up to 80k | Low | Responsive integration, keyboard behavior, and browser checks |
| 08.5 Complete Accessibility and Security Review | 140k-240k | Up to 90k | Low | Cross-product audit and accepted rework |
| **Epic Total** | **700k-1,210k** | **Up to 380k** | **Low** | **Integration and visual acceptance can require repeated review** |

## Tasks

### Task 08.1: Assemble the Desktop Workspace

- [ ] Add Rectifier branding, red `{ }` logo, lock icon, and privacy message.
- [ ] Implement the PRD Browser storage popover from the privacy message,
  including confirmed Clear saved workspace; keep it outside the main Action
  Dock.
- [ ] Place Input, central Action Dock, and Result in the desktop workspace.
- [ ] Place Upload and Clear inside the Input panel.
- [ ] Place Code, Tree, Object, Copy, and Download inside Result controls.
- [ ] Attach the Schema tab to the right edge, separate from actions.
- [ ] Place the Status and Error tray below the workspace.
- [ ] Show empty result guidance before a result exists.

### Task 08.2: Assemble Actions and Feedback

- [ ] Order central actions as Beautify, Minify, Convert, Repair JSON.
- [ ] Keep Repair JSON at the end.
- [ ] Connect every disabled action to its exact reason.
- [ ] Add brief success feedback for Copy, Download, and completed actions.
- [ ] Confirm actions never alter protected input.

### Task 08.3: Apply the Approved Light Visual System

- [ ] Use Prompt for interface text and monospace for all code-like content.
- [ ] Use `#000000`, `#EA4242`, `#F6F4F1`, and `#FFFFFF` as core colors.
- [ ] Apply paper texture, thin black/gray borders, small sharp radiuses, and
  motion no longer than 200 milliseconds for hover, press, drawer, and dialog
  transitions.
- [ ] Use red only for error, repair, and intentional emphasis.
- [ ] Preserve clear focus, hover, active, disabled, and loading states.

### Task 08.4: Implement Mobile and Responsive Behavior

- [ ] Switch between Input and Result on mobile.
- [ ] Keep all actions reachable without horizontal page scrolling.
- [ ] Keep Schema Check reachable on small screens.
- [ ] Preserve error focus and dialog focus behavior on mobile.
- [ ] Test at least 390x844 mobile, 768x1024 tablet, and 1440x900 desktop
  viewports.

### Task 08.5: Complete Accessibility and Security Review

- [ ] Verify keyboard access to every action, tab, view, collapse control, and
  dialog.
- [ ] Verify accessible names and descriptions for icon-only and disabled
  controls.
- [ ] Verify visible focus and usable contrast.
- [ ] Render JSON, schema, and converted output only as text.
- [ ] Confirm downloads use local object URLs and revoke them.
- [ ] Confirm no analytics or network request captures editor content.

## Verification

```bash
npm test -- --run tests/components/Workspace.test.tsx \
  tests/components/Accessibility.test.tsx
npm run typecheck
npm run build
```

Expected result: the full product is usable on desktop and mobile, follows the
approved light design, and passes accessibility checks.

## Acceptance Checklist

- [ ] Desktop and mobile workspace follow PRD behavior.
- [ ] Approved prototype direction and prototype exceptions are followed.
- [ ] Schema Check is separate and Repair JSON is the last action.
- [ ] Upload, Clear, Copy, and Download are icon controls with tooltips.
- [ ] Disabled controls explain why.
- [ ] No user content is rendered as executable HTML.
- [ ] Requirements, Code, and final UI Reviewers approve.

## Handoff to Later Epics

Provide the accepted full-flow UI, known visual exceptions, supported
viewports, accessibility review results, and production build result. Epic 09
will test the complete product in a real browser.
