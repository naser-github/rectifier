# Rectifier v1 Epic Implementation Roadmap

> **For agentic workers:** Use
> `superpowers:subagent-driven-development` or `superpowers:executing-plans`
> when executing an epic. Every task must follow `doc/agent-workflow.md`.

**Goal:** Build a fully client-side JSON validation, strict repair, formatting,
conversion, schema-checking, and inspection tool that supports files up to
10 MB without freezing the interface.

**Architecture:** Rectifier is a static React application. CodeMirror handles
editing and code views. Pure TypeScript modules own repair rules. One dedicated
Web Worker owns expensive parsing and processing. The main thread owns only
interface state and browser interactions.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, CodeMirror 6,
`jsonc-parser`, Ajv with `ajv-formats`, `js-yaml`, `fast-xml-parser`, Papa Parse,
`@tanstack/react-virtual`, `idb-keyval`, Radix Tooltip, Lucide React, `clsx`,
`tailwind-merge`, Vitest, Testing Library, and Playwright.

## 1. Purpose of This Roadmap

This file is the master execution map. It explains:

- Which epics make up Rectifier v1.
- Why the epics are separated.
- Which order they must follow.
- Which work can run in parallel.
- Which milestone proves each epic is complete.
- Which detailed epic file an agent must execute.

The detailed steps, owned files, required tests, review policy, and exit gate
for each epic live under `doc/implementation/`.

## 2. Source Documents and Priority

All implementation work must read:

1. `AGENTS.md` for coding and architecture rules.
2. `doc/brd.md` for business, privacy, and repair-safety rules.
3. `doc/prd.md` for detailed product behavior and acceptance criteria.
4. `doc/ui/rectifier-light-v1.html` for approved visual direction.
5. This roadmap for epic order and global execution rules.
6. The assigned epic file for exact execution work.
7. `doc/agent-workflow.md` for roles, handoffs, reviews, and acceptance.

When documents differ:

1. BRD controls business, privacy, and repair safety.
2. PRD controls detailed product behavior.
3. The approved prototype controls visual direction.
4. This roadmap controls epic order and project-wide technical rules.
5. The assigned epic file controls task execution inside that epic.

Do not silently resolve a real conflict. Stop and report it to the Project
Orchestrator.

## 3. Main Technical Decisions

### 3.1 Client-Only Product

- Use React and Vite.
- Produce static files.
- Do not add a backend, account system, server route, or AI service.
- Keep user JSON and schemas inside the browser.

### 3.2 Strict Repair Engine

- Keep repair logic in pure TypeScript under `src/engine/repair/`.
- Use `jsonc-parser` for strict diagnostics.
- Use a custom tolerant tokenizer, candidate generator, and verifier.
- Do not use broad automatic repair as the source of truth.
- Never invent, remove, reorder, or change user data.
- Return `safe`, `ambiguous`, or `manual`; never guess.

### 3.3 Worker Processing

- Use one dedicated Web Worker.
- Send the complete input once per revision.
- Reference the stored revision for later actions.
- Ignore stale jobs and revisions.
- Do not parse arbitrary JSON chunks independently.

### 3.4 Interface and Styling

- Use Prompt for interface text and monospace for code.
- Follow the approved light paper design.
- Put reusable visual primitives in `src/components/ui/`.
- Keep feature behavior inside feature folders.
- Use Tailwind utilities in components.
- Use `src/styles/global.css` only for Tailwind import, tokens, base styles,
  paper texture, CodeMirror overrides, shared animations, and accessibility
  helpers.

## 4. Planned Source Boundaries

```text
src/
  app/                 Application entry and composition
  components/
    actions/           Main action dock
    editor/            Input and result editors
    errors/            Diagnostics and repair dialogs
    layout/            Desktop and mobile workspace
    result/            Code, Tree, and Object result views
    schema/            Schema drawer
    ui/                Reusable presentation primitives
  domain/              Shared contracts and discriminated unions
  engine/repair/       Pure strict repair engine
  hooks/               Browser and worker coordination
  lib/                 Small general helpers
  state/               Workspace state transitions
  styles/              Global CSS entry
  worker/              Worker adapter, converters, diagnostics, schema
tests/                 Unit and component tests
e2e/                   Browser and performance tests
```

Shared contracts include files under `src/domain/`, the worker protocol,
workspace reducer state, repair result types, and shared UI primitive APIs.
Only the Project Orchestrator may approve a shared contract change.

## 5. Epic Order

```text
Epic 01 Foundation and Contracts
  |
  v
Epic 02 Strict Repair Engine
  |
  v
Epic 03 Worker and Validation
  |
  v
Epic 04 Core Workspace and Shared UI
  |
  +--------------------+--------------------+
  v                    v                    v
Epic 05 Repair UX   Epic 06 Processing   Epic 07 Result Views
  |                    |                    |
  +--------------------+--------------------+
                       |
                       v
             Epic 08 Product UI and Accessibility
                       |
                       v
             Epic 09 E2E, Performance, and Release
```

The complete product interface must not be built before Epic 02 receives
Repair Safety approval.

## 6. Epic Roadmap

| Epic | Purpose | Depends On | Required Workflow | Exit Milestone | Status |
| --- | --- | --- | --- | --- | --- |
| [01 Foundation and Contracts](implementation/epic-01-foundation-and-contracts.md) | Create the runnable client, test tools, architecture boundaries, and shared contracts | None | Normal | Foundation Ready | Not started |
| [02 Strict Repair Engine](implementation/epic-02-strict-repair-engine.md) | Prove repairs cannot change user data or guess intent | Epic 01 contracts and tests | Repair-sensitive | Repair Safety Approved | Not started |
| [03 Worker and Validation](implementation/epic-03-worker-and-validation.md) | Add revision-based worker processing, validation, upload, and error focus | Epics 01-02 | Repair-sensitive | Validation Pipeline Ready | Not started |
| [04 Core Workspace and Shared UI](implementation/epic-04-core-workspace-and-shared-ui.md) | Add workspace state, shared controls, first sample, disabled reasons, and storage | Epic 03 | Normal | Core Workspace Ready | Not started |
| [05 Repair Experience](implementation/epic-05-repair-experience.md) | Add safe repair preview, ambiguous choices, and manual path | Epic 04 | Repair-sensitive | Repair UX Approved | Not started |
| [06 Format, Convert, and Schema](implementation/epic-06-format-convert-schema.md) | Add Beautify, Minify, YAML, XML, flattened CSV, and Schema Check | Epic 04 | Normal | Processing Tools Ready | Not started |
| [07 Result Views and Output](implementation/epic-07-result-views-and-output.md) | Add editable Code, collapsible Tree/Object, Copy, and Download | Epic 04 | Normal | Result Experience Ready | Not started |
| [08 Product UI, Accessibility, and Responsive](implementation/epic-08-product-ui-accessibility-responsive.md) | Assemble and polish the approved light workspace | Epics 05-07 | UI Integration | UI Acceptance Approved | Not started |
| [09 E2E, Performance, and Release](implementation/epic-09-e2e-performance-release.md) | Prove full flows, 10 MB behavior, safety, and release readiness | Epics 01-08 | Release | Release Candidate Approved | Not started |

### 6.1 Requirement Ownership Map

| Product Area | Primary Epic | Release Proof |
| --- | --- | --- |
| Static client, stack, contracts, and architecture boundaries | Epic 01 | Epic 01 verification and Epic 09 build |
| Strict safe, ambiguous, and manual repair classification | Epic 02 | Repair safety suite and Epic 09 adversarial tests |
| Input, upload, automatic validation, diagnostics, and error focus | Epic 03 | Worker/component tests and Epic 09 browser flows |
| Shared controls, disabled reasons, first sample, and latest workspace | Epic 04 | State/component tests and Epic 09 restore flow |
| Safe repair preview and user-guided ambiguous choices | Epic 05 | Repair flow tests and Epic 09 browser flows |
| Beautify, Minify, YAML, XML, flattened CSV, and Schema Check | Epic 06 | Worker tests and Epic 09 browser flows |
| Code, Tree, Object, collapse, Copy, and Download | Epic 07 | Result tests and Epic 09 browser flows |
| Approved light UI, Prompt, paper texture, mobile, and accessibility | Epic 08 | UI/accessibility review and Epic 09 browser flows |
| 10 MB, deep nesting, large arrays, broken JSON, and release evidence | Epic 09 | Full release verification |

## 7. Global Execution Policy

### 7.1 Epic Entry Gate

An epic may start only when:

- Every required dependency milestone is accepted.
- Its detailed epic file has no unresolved conflict with the BRD or PRD.
- The Project Orchestrator selects its first dependency-safe task.
- The Orchestrator creates a task brief with exact file ownership.
- No active Worker owns the same files or shared contracts.

Inside each epic, numbered tasks run in numeric order unless the epic explicitly
allows a different order. The Orchestrator may parallelize steps or tasks only
after recording that they have no unfinished dependency and no overlapping
files or shared contracts.

### 7.2 Task Execution

For every task:

1. Worker defines the exact verification before editing.
2. For behavior code and bug fixes, Worker writes the required failing test and
   confirms the expected failure.
3. For configuration or documentation work, Worker records the focused check
   that will prove the change.
4. Worker implements only the assigned behavior.
5. Worker runs focused tests, type checking, and other required verification.
6. Worker sends a handoff with changed files, results, limits, and review risks.
7. Required reviewers inspect the work.
8. Worker fixes accepted findings and reviewers re-check affected areas.
9. Project Orchestrator verifies the task and marks its epic checkbox complete.

Documentation-only tasks use the documentation workflow in
`doc/agent-workflow.md`.

### 7.3 Review Policy

Normal tasks require:

- Requirements Reviewer.
- Code Reviewer.
- Project Orchestrator acceptance.

Repair-sensitive tasks also require:

- Repair Safety Reviewer.

A task is blocked by any unresolved Blocking finding. Important findings must
be fixed unless the Orchestrator records a specific reason for deferral.

### 7.4 File Ownership and Parallel Work

- One Worker owns one task.
- A Worker edits only files listed in its task brief.
- Two active Workers may not edit the same file.
- Shared contract changes stop dependent parallel work.
- Epics 05, 06, and 07 may run in parallel only after Epic 04 is accepted and
  the Orchestrator assigns non-overlapping files.
- Epic 08 cannot finish until Epics 05, 06, and 07 are accepted.

### 7.5 Commit Policy

- Prefer one focused commit for each accepted task.
- Do not mix unrelated cleanup with a task.
- Do not commit generated output or temporary files unless the epic requires
  them.
- Do not mark an epic complete merely because code exists; its exit gate and
  milestone review must pass.

### 7.6 Epic Exit Gate

The Project Orchestrator accepts an epic only when:

- Every required task checkbox in the epic file is complete.
- Every task has passed its required reviews.
- All epic verification commands pass.
- The epic acceptance checklist passes.
- No Blocking or unexplained Important finding remains.
- The epic's output and contract handoff are recorded for dependent epics.
- The roadmap status is changed to `Accepted`.

## 8. Global Repair Safety Rules

1. Never apply a repair without complete strict JSON validation.
2. Never return a candidate that changes the verified data-token fingerprint.
3. Never automatically select an ambiguous candidate.
4. Never invent missing keys, values, booleans, nulls, or numbers.
5. Never use AI or free-text instructions to repair JSON.
6. Always show syntax edits before applying them.
7. Always keep the original input unchanged.
8. Return manual editing guidance when proof is not possible.

## 9. Global Performance Rules

1. Reject files larger than 10 MB before reading the complete file.
2. Keep expensive work inside the Web Worker.
3. Send complete input to the worker once per input revision.
4. Send later actions by revision.
5. Ignore stale worker responses.
6. Debounce validation while typing.
7. Persist after idle time, not every keystroke.
8. Virtualize large Tree and Object views.
9. Avoid duplicate 10 MB strings in React state.

## 10. Project Completion Gate

- [ ] Every epic milestone is accepted.
- [ ] BRD and PRD requirements have an implemented and tested owner.
- [ ] There is no backend or AI dependency.
- [ ] Original input always remains unchanged.
- [ ] Automatic validation works without a Validate button.
- [ ] First-error focus and red caret work.
- [ ] Safe repair requires preview and acceptance.
- [ ] Ambiguous repair requires explicit user selection.
- [ ] Unsupported repair returns manual guidance.
- [ ] Beautify, Minify, YAML, XML, flattened CSV, and Schema Check work.
- [ ] Code, Tree, and Object views collapse nested JSON.
- [ ] Every disabled action explains why.
- [ ] Copy and Download use the exact current result.
- [ ] 10 MB, deep nesting, large arrays, heavily broken JSON, broken Unicode,
  invalid escapes, and unterminated strings are tested.
- [ ] Validation time, repair-analysis time, and available memory measurements
  are recorded.
- [ ] The approved light prototype and PRD prototype exceptions are followed.
- [ ] Final verification passes:

```bash
npm run typecheck
npm test -- --run
npm run build
npx playwright test
```
