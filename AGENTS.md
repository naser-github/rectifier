# Rectifier Agent Guide

This file defines the coding standards every agent must follow while working on
Rectifier.

## 1. Read Before Coding

Read these files before changing code:

1. `doc/brd.md` for business and repair-safety rules.
2. `doc/prd.md` for product behavior, UX, and acceptance criteria.
3. `doc/ui/rectifier-light-v1.html` for the approved visual direction.
4. `doc/implementation.md` for architecture, epic order, and global execution
   policy.
5. The assigned file under `doc/implementation/` for exact tasks, owned files,
   tests, reviewers, and the epic exit gate.
6. `doc/agent-workflow.md` for required agent roles, reviews, and acceptance.

When documents differ:

1. The BRD controls business, privacy, and repair-safety rules.
2. The PRD controls detailed product behavior.
3. The approved prototype controls visual direction.
4. The master implementation roadmap controls epic order and global technical
   rules.
5. The assigned epic plan controls execution inside that epic.

Do not silently change product scope or safety rules. Update the relevant
document first when a product decision changes.

## 2. Required Build Order

Follow the risk-first epic order in `doc/implementation.md` and execute the
exact tasks in the assigned file under `doc/implementation/`.

Every task must also follow `doc/agent-workflow.md`. A task is not complete
until its required reviews and Orchestrator verification pass.

The risk-first implementation stages are:

1. Foundation and Contracts.
2. Strict Repair Engine.
3. Worker and Validation.
4. Core Workspace and Shared UI.
5. Repair Experience, Processing Tools, and Result Views; these are separate
   Epics 05, 06, and 07.
6. Product UI, Accessibility, and Responsive integration.
7. E2E, Performance, and Release.

Do not build the complete UI before the Repair Safety Approved milestone.

## 3. Architecture Boundaries

- `src/engine/` contains pure TypeScript business logic.
- `src/worker/` adapts pure logic to Web Worker messages.
- `src/domain/` contains shared types and contracts.
- `src/components/` contains presentation and user interaction.
- `src/hooks/` coordinates browser APIs and UI state.
- `src/state/` owns workspace state transitions.
- `src/lib/` contains small general helpers.

The strict repair engine:

- Must not import React, DOM APIs, CodeMirror, or Web Worker APIs.
- Must never mutate the original input.
- Must return explicit safe, ambiguous, or manual results.
- Must never invent, remove, reorder, or change user data.

The Web Worker:

- Must call pure engine functions.
- Must not duplicate repair rules.
- Must ignore stale jobs and revisions.

The UI:

- Must not contain parsing, repair, conversion, or schema business logic.
- Must treat the original input as protected.

## 4. Component Organization

Use feature folders for product-specific components:

```text
src/components/
  actions/
  editor/
  errors/
  layout/
  result/
  schema/
  ui/
```

Put reusable presentation primitives in `src/components/ui/`:

```text
Button.tsx
Dialog.tsx
DisabledReason.tsx
IconButton.tsx
Panel.tsx
Toast.tsx
Tooltip.tsx
```

Create a shared component only when:

- It is used in at least two real places.
- The places share the same behavior, not only a similar color.
- A bug fix or accessibility fix should affect every usage.
- Its API can stay small and clear.

Do not create a generic component for one use case. Do not build large
configuration-heavy components. Prefer composition of small components.

Keep feature-specific behavior in the feature folder even when it uses shared
UI primitives.

Do not create a broad `common/` folder. Put shared visual primitives in
`components/ui/`, shared domain contracts in `domain/`, and small general
helpers in `lib/`.

## 5. React and TypeScript Rules

- Use TypeScript strict mode.
- Prefer function components and hooks.
- Prefer pure functions and immutable updates.
- Use discriminated unions for state with different outcomes.
- Avoid `any`. Use `unknown` and narrow it safely.
- Keep one main responsibility per file.
- Split a component when it owns unrelated state or becomes difficult to test.
- Avoid classes unless a library requires them or they provide a clear benefit.
- Keep props small and explicit.
- Do not pass the complete workspace state to components that need only a few
  fields.

Use shared domain types instead of recreating similar local types.

## 6. Tailwind and CSS Rules

Use Tailwind utility classes inside React components for component layout and
appearance.

Use one global stylesheet: `src/styles/global.css`.

Global CSS may contain only:

- Tailwind import.
- Design tokens and CSS variables.
- Prompt and monospace font setup.
- Base `body` and element defaults.
- Paper texture.
- CodeMirror theme and required editor overrides.
- Shared keyframes and reduced-motion behavior.
- Accessibility helpers that cannot be expressed clearly with utilities.

Do not place normal component-specific styles in global CSS.

Use `src/lib/cn.ts` to merge conditional Tailwind classes. Use `clsx` and
`tailwind-merge`; do not build class strings manually across many branches.

Prefer design tokens over repeated raw colors:

```css
:root {
  --color-black: #000000;
  --color-red: #ea4242;
  --color-paper: #f6f4f1;
  --color-white: #ffffff;
}
```

Do not introduce dark-mode styles in v1.

## 7. Shared UI Rules

- Use `Button` for repeated text-button behavior and variants.
- Use `IconButton` for Upload, Clear, Copy, Download, and similar icon actions.
- Use `DisabledReason` for every disabled control.
- Use `Tooltip` for icon explanations and disabled reasons.
- Use shared `Dialog` behavior for repair preview and ambiguous choices.
- Use shared `Toast` behavior only for short success feedback.
- Keep important errors and repair decisions visible outside temporary toasts.

Shared components must include keyboard behavior, focus states, accessible
names, and tests.

## 8. State and Data Flow

- Keep the original input separate from generated results.
- Do not copy the full 10 MB input into multiple React state fields.
- Send input to the worker once per revision.
- Send later actions using the stored revision.
- Ignore stale worker responses.
- Keep result format and result text together.
- Keep repair candidates immutable.
- Persist only the latest workspace.

## 9. Testing Rules

Use test-driven development for repair rules and bug fixes:

1. Write the failing test.
2. Confirm it fails for the expected reason.
3. Implement the smallest correct change.
4. Confirm the test passes.
5. Run related tests.

Every repair rule requires:

- A safe repair test.
- An unsafe refusal test.
- A data-preservation test.
- An ambiguous or manual case when relevant.

Shared UI components require keyboard and accessibility tests.

Do not weaken or remove a test only to make the suite pass.

## 10. Accessibility Rules

- Every action must be keyboard usable.
- Icon-only buttons require accessible names and tooltips.
- Disabled reasons must work on hover and keyboard focus.
- Error state must not rely on color alone.
- Focus must remain visible.
- Respect reduced-motion preferences.

## 11. Performance Rules

- Keep expensive JSON work in the Web Worker.
- Reject files larger than 10 MB before reading them fully.
- Virtualize large Tree and Object views.
- Avoid unnecessary parsing and large-string copies.
- Test 1 MB, 5 MB, and 10 MB cases.
- Record validation and repair-analysis time before release.

## 12. Change Discipline

- Follow existing patterns unless the master roadmap or assigned epic
  explicitly changes them.
- Keep changes focused on the active task.
- Edit only files listed in the task brief.
- Do not mark an epic task complete until the required reviewers and Project
  Orchestrator accept it.
- Do not add dependencies without a clear need.
- Do not add backend, AI, accounts, or dark mode.
- Do not edit the approved UI prototype as implementation code.
- Update documentation when a confirmed product or architecture decision
  changes.

## 13. Required Verification

Before claiming a task is complete, run the commands relevant to that task.
Before claiming the project is complete, run:

```bash
npm run typecheck
npm test -- --run
npm run build
npx playwright test
```

Report any command that could not be run. Do not claim unverified behavior.
