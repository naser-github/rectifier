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
7. `doc/agent-model-routing.md` for agent capability tiers, reasoning, context,
   tools, fallback, retry, and escalation.
8. `doc/execution-reports/README.md` for required task and epic cost reporting.

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
until its required reviews and Orchestrator verification pass, its task
execution report is complete, and its epic execution report is updated.

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

### 2.1 Mandatory Epic Start Reminder

When the user asks to start or execute an epic, the Project Orchestrator must
stop before creating reports, task briefs, dispatching agents, editing
implementation files, or starting the first Worker.

Show the user:

- The epic number, name, and exit milestone.
- Dependency and epic entry-gate status.
- The epic implementation-plan token budget and planning retry reserve.
- The planned epic execution report path.
- The first dependency-safe task.
- The planned first task brief and task execution report paths.
- A short list of the setup actions that will happen after approval.

End the reminder by asking whether to start the epic. Wait for clear user
approval. Do not treat an earlier planning approval as approval to start an
epic.

## 3. Required Workflow Selection

Before a Worker starts, the Project Orchestrator must name the task's required
workflow, reviewers, and agent routing in the task brief.

Use the workflows in `doc/agent-workflow.md`:

- Normal Task for implementation without repair or user-facing visual changes.
- Repair-Sensitive Task for repair engine, repair contracts, repair worker
  messages, repair state, or repair eligibility.
- UI Feature Task for user-facing visual or interaction behavior.
- Repair-Sensitive UI Task when both repair and UI behavior change.
- UI Integration Task for Epic 08.
- Release Workflow for Epic 09.
- Documentation-Only Task for documentation changes.

The Project Orchestrator performs requirements review for every task. Use only
the specialist reviewers required by the selected workflow. When more than one
specialist rule applies, include each required specialist reviewer.

Small Task workflow is allowed only when the task does not change product,
repair, user-facing visual, accessibility, or shared-contract behavior.

Follow `doc/agent-model-routing.md`. Never downgrade mandatory Tier A work.

## 4. Architecture Boundaries

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
- Must own `classifyRepairEligibility()`.
- Eligibility classification may report only whether a supported repair rule
  may apply.
- Eligibility classification must not generate, verify, select, or expose a
  repair candidate.
- Full candidate generation and verification may begin only after the user
  clicks Repair JSON.

The Web Worker:

- Must call pure engine functions.
- Must not duplicate repair rules.
- Must ignore stale jobs and revisions.
- Must use `classifyRepairEligibility()` for automatic Repair JSON eligibility.

The UI:

- Must not contain parsing, repair, conversion, or schema business logic.
- Must treat the original input as protected.

## 5. Component Organization

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

## 6. React and TypeScript Rules

- Use TypeScript strict mode.
- Enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, and
  `noUnusedParameters`.
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
- Use `interface` for stable object-shaped public contracts, service
  boundaries, and component props.
- Use `type` for discriminated unions, aliases, tuples, primitive unions,
  mapped types, and conditional types.
- Do not prefix interfaces with `I`.
- Prefer `readonly` properties and `ReadonlyArray` at boundaries where
  mutation is not intended.
- Export shared contracts from `src/domain/`. Keep feature-only and file-only
  types local.
- Model expected business outcomes with explicit result types or discriminated
  unions. Do not use exceptions for normal validation, repair, or ambiguity
  outcomes.
- Throw only for unexpected failures. Never silently swallow an error.

Use shared domain types instead of recreating similar local types.

### 6.1 Naming Rules

- Use `PascalCase` for components, interfaces, types, and enums.
- Use `camelCase` for variables, functions, props, and object fields.
- Prefix hooks with `use`.
- Prefix booleans with `is`, `has`, `can`, or `should` when practical.
- Use `UPPER_SNAKE_CASE` for true module-level constants.
- Name files after their main export. Use `.test.ts` or `.test.tsx` for tests.
- Use product terms from the BRD, PRD, and domain contracts. Do not create
  alternate names for the same concept.

### 6.2 Dependency and Side-Effect Rules

- Dependencies must point inward toward stable contracts and pure logic.
- `src/engine/` may depend only on `src/domain/` and small pure helpers from
  `src/lib/`.
- `src/domain/` must not depend on React, browser APIs, workers, components, or
  feature implementations.
- Components may use hooks and domain contracts, but must not call repair,
  conversion, schema, or parsing implementations directly.
- Keep browser side effects in hooks or adapters. Keep business decisions in
  pure functions.
- Define small interfaces at browser and service boundaries, including worker
  clients, storage, clipboard, file upload, and download behavior when those
  boundaries need substitution in tests.
- Inject boundary dependencies where a test must replace them. Do not hide
  mutable global services inside business logic.
- Do not create circular imports.
- Avoid broad barrel `index.ts` files. Use direct imports unless a small,
  intentional public API needs one.
- Do not deep-import another feature's private files.
- Keep the `dependency-cruiser` rules passing. Do not add a known-violation
  allowlist to bypass an architecture failure.

### 6.3 Maintainability Rules

- Keep functions focused and return early when it improves clarity.
- Replace repeated meaningful values with named constants owned by the correct
  feature or domain module.
- Do not add abstractions before there are real repeated behaviors or a clear
  architecture boundary.
- Comments explain why a non-obvious decision exists, not what readable code
  already says.
- Do not leave dead code, commented-out code, placeholder implementations, or
  untracked follow-up work.
- Do not weaken types, tests, or architecture boundaries to make a change pass.
- Use ESLint for code-quality rules and Prettier for formatting.
- Do not disable a lint rule without a narrow reason recorded beside the
  disable.

## 7. Tailwind and CSS Rules

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

## 8. Shared UI Rules

- Use `Button` for repeated text-button behavior and variants.
- Use `IconButton` for Upload, Clear, Copy, Download, and similar icon actions.
- Use `DisabledReason` for every disabled control.
- Use `Tooltip` for icon explanations and disabled reasons.
- Use shared `Dialog` behavior for repair preview and ambiguous choices.
- Use shared `Toast` behavior only for short success feedback.
- Keep important errors and repair decisions visible outside temporary toasts.

Shared components must include keyboard behavior, focus states, accessible
names, and tests.

## 9. State and Data Flow

- Keep the original input separate from generated results.
- Do not copy the full 10 MB input into multiple React state fields.
- Send input to the worker once per revision.
- Send later actions using the stored revision.
- Ignore stale worker responses.
- Keep result format and result text together.
- Keep repair candidates immutable.
- Store repair eligibility separately from generated repair candidates.
- Treat eligibility as permission to open the user-triggered repair flow, not
  proof that a verified candidate exists.
- If full analysis finds no verified candidate, show manual guidance.
- Persist only the latest workspace.

## 10. Testing Rules

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

Repair eligibility requires:

- A supported-rule classification test.
- An unsupported-rule classification test.
- A false-positive boundary test that continues to manual guidance after
  user-triggered full analysis.
- A test proving automatic eligibility never generates a candidate.

Shared UI components require keyboard and accessibility tests.

Do not weaken or remove a test only to make the suite pass.

## 11. Accessibility Rules

- Every action must be keyboard usable.
- Icon-only buttons require accessible names and tooltips.
- Disabled reasons must work on hover and keyboard focus.
- Error state must not rely on color alone.
- Focus must remain visible.
- Respect reduced-motion preferences.

## 12. Performance Rules

- Keep expensive JSON work in the Web Worker.
- Reject files larger than 10 MB before reading them fully.
- Virtualize large Tree and Object views.
- Avoid unnecessary parsing and large-string copies.
- Test 1 MB, 5 MB, and 10 MB cases.
- Record validation and repair-analysis time before release.

## 13. Change Discipline

- Follow existing patterns unless the master roadmap or assigned epic
  explicitly changes them.
- Keep changes focused on the active task.
- Edit only files listed in the task brief.
- Do not mark an epic task complete until its required specialist reviewers,
  when any, and the Project Orchestrator accept it.
- Do not add dependencies without a clear need.
- Do not add backend, AI, accounts, or dark mode.
- Do not edit the approved UI prototype as implementation code.
- Update documentation when a confirmed product or architecture decision
  changes.

## 14. Required Execution Reporting

The Project Orchestrator owns execution reporting. Workers and Reviewers provide
their execution details in their handoffs; they do not edit report files unless
the task brief explicitly assigns those files.

During implementation planning, the Project Orchestrator must add an estimated
agent-token range, planning retry reserve, confidence level, and estimate basis
for every task in the detailed epic plan.

Before starting a task, the Project Orchestrator must:

- Confirm the assigned epic plan contains the task's implementation-plan
  usage estimate and planning retry reserve.
- Create the task execution report from
  `doc/execution-reports/templates/task-report.md`.
- Refine the implementation-plan estimate using the selected roles, providers,
  models, current pricing, and execution retry reserve.
- Record the source implementation-plan estimate, refined estimated usage
  cost, estimate basis, and retry reserve.
- Update the epic plan and record the reason before execution when the refined
  estimate exceeds the implementation-plan upper bound.
- Record the task report and epic report paths in the task brief.

After every Orchestrator, Worker, Reviewer, retry, fallback, or rework
execution, the Project Orchestrator must record:

- Execution ID, role, provider, exact model, capability tier, reasoning level,
  billing type, and processing tier.
- Reported usage dimensions provided by the runner or provider.
- Calculated usage cost, billed cost, or API-equivalent cost when each is
  available.
- The execution result and any model-routing change reason.

Estimated values must be labeled `Estimated`. Actual usage or cost must never
be guessed. Record `Unavailable` and the reason when the runner, provider, or
invoice does not expose a required value.

A task is not complete until its task execution report is complete and its epic
execution report is updated. An epic is not complete until its epic execution
report is complete. Follow `doc/execution-reports/README.md`.

## 15. Required Verification

Before claiming a task is complete, run the commands relevant to that task.
Before claiming the project is complete, run:

```bash
npm run lint
npm run format:check
npm run architecture
npm run typecheck
npm test -- --run
npm run build
npx playwright test
```

Report any command that could not be run. Do not claim unverified behavior.
