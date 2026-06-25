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
interface state and browser interactions. The finished project must run through
one Docker Compose app service that builds and serves the static client in one
container.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, CodeMirror 6,
`jsonc-parser`, Ajv with `ajv-formats`, `js-yaml`, `fast-xml-parser`, Papa Parse,
`@tanstack/react-virtual`, `idb-keyval`, Radix Tooltip, Lucide React, `clsx`,
`tailwind-merge`, ESLint, Prettier, dependency-cruiser, Vitest, Testing Library,
and Playwright.

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
8. `doc/agent-model-routing.md` for agent capability, reasoning, context, tools,
   fallback, retry, and escalation.
9. `doc/execution-reports/README.md` for task and epic execution-cost reporting.

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
- Provide one Docker Compose app service for local and release runtime.
- Use one container to serve the built static client.
- Do not add a backend, account system, server route, or AI service.
- Do not add a database, cache, model service, or sidecar container.
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

### 3.5 Code Quality and Interface Policy

- Follow the interface, type, naming, dependency, side-effect, and
  maintainability rules in `AGENTS.md`.
- Use `interface` for stable object-shaped public contracts and replaceable
  browser or service boundaries.
- Use `type` for discriminated unions and other composed TypeScript types.
- Keep shared contracts in `src/domain/`; keep feature-private types local.
- Keep domain and engine logic pure. Put browser side effects behind hooks or
  small adapters with explicit interfaces when tests need substitution.
- Enforce inward dependency direction, direct imports, and no circular imports.
- Use dependency-cruiser to enforce source boundaries and circular-import
  rules.
- Model expected validation, repair, and ambiguity outcomes with explicit
  result types rather than exceptions.
- Enforce code-quality rules with ESLint and formatting with Prettier.

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

Architecture tests must enforce the source dependency direction, forbidden
imports, and circular-import policy defined in `AGENTS.md`.

## 5. Epic Order

```text
Epic 00 Docker Runtime Foundation
  |
  v
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
| [00 Docker Runtime Foundation](implementation/epic-00-docker-runtime-foundation.md) | Define one-container Docker Compose runtime for the static client | None | Normal configuration and documentation | Docker Runtime Ready | Accepted |
| [01 Foundation and Contracts](implementation/epic-01-foundation-and-contracts.md) | Create the runnable client, test tools, architecture boundaries, and shared contracts | Epic 00 Docker runtime | Normal plus UI Feature for visual shell | Foundation Ready | Accepted |
| [02 Strict Repair Engine](implementation/epic-02-strict-repair-engine.md) | Prove repairs cannot change user data or guess intent | Epic 01 contracts and tests | Repair-sensitive | Repair Safety Approved | Accepted |
| [03 Worker and Validation](implementation/epic-03-worker-and-validation.md) | Add revision-based worker processing, validation, upload, and error focus | Epics 01-02 | Normal plus Repair Safety and UI Feature tasks | Validation Pipeline Ready | Accepted |
| [04 Core Workspace and Shared UI](implementation/epic-04-core-workspace-and-shared-ui.md) | Add workspace state, shared controls, first sample, disabled reasons, and storage | Epic 03 | Normal plus Repair Safety and UI Feature tasks | Core Workspace Ready | Not started |
| [05 Repair Experience](implementation/epic-05-repair-experience.md) | Add safe repair preview, ambiguous choices, and manual path | Epic 04 | Repair-Sensitive UI | Repair UX Approved | Not started |
| [06 Format, Convert, and Schema](implementation/epic-06-format-convert-schema.md) | Add Beautify, Minify, YAML, XML, flattened CSV, and Schema Check | Epic 04 | Normal plus UI Feature for Schema Drawer | Processing Tools Ready | Not started |
| [07 Result Views and Output](implementation/epic-07-result-views-and-output.md) | Add editable Code, collapsible Tree/Object, Copy, and Download | Epic 04 | UI Feature | Result Experience Ready | Not started |
| [08 Product UI, Accessibility, and Responsive](implementation/epic-08-product-ui-accessibility-responsive.md) | Assemble and polish the approved light workspace | Epics 05-07 | UI Integration | UI Acceptance Approved | Not started |
| [09 E2E, Performance, and Release](implementation/epic-09-e2e-performance-release.md) | Prove full flows, 10 MB behavior, safety, and release readiness | Epics 01-08 | Release | Release Candidate Approved | Not started |

### 6.1 Requirement Ownership Map

| Product Area | Primary Epic | Release Proof |
| --- | --- | --- |
| One-container Docker Compose runtime | Epic 00 | Epic 00 verification and Epic 09 run guide |
| Static client, stack, contracts, and architecture boundaries | Epic 01 | Epic 01 verification and Epic 09 build |
| Strict safe, ambiguous, and manual repair classification | Epic 02 | Repair safety suite and Epic 09 adversarial tests |
| Input, upload, automatic validation, diagnostics, and error focus | Epic 03 | Worker/component tests and Epic 09 browser flows |
| Shared controls, disabled reasons, first sample, and latest workspace | Epic 04 | State/component tests and Epic 09 restore flow |
| Safe repair preview and user-guided ambiguous choices | Epic 05 | Repair flow tests and Epic 09 browser flows |
| Beautify, Minify, YAML, XML, flattened CSV, and Schema Check | Epic 06 | Worker tests and Epic 09 browser flows |
| Code, Tree, Object, collapse, Copy, and Download | Epic 07 | Result tests and Epic 09 browser flows |
| Approved light UI, Prompt, paper texture, mobile, and accessibility | Epic 08 | UI/accessibility review and Epic 09 browser flows |
| 10 MB, deep nesting, large arrays, broken JSON, and release evidence | Epic 09 | Full release verification |

### 6.2 Implementation Planning Usage Budget

The detailed epic plans estimate agent usage before implementation starts.
These estimates are an early planning control, not actual usage or a cost
calculation.

`Estimated agent tokens` is the combined token proxy for planned Orchestrator,
Worker, and required specialist Reviewer executions. `Planning retry reserve`
is separate and may be used only for retries, fallback, or accepted rework.

These budgets use the lean workflow: the Orchestrator owns requirements,
small-task, and documentation checks; independent specialist reviewers run
only for code, repair-safety, UI, and release risks.

| Epic | Estimated Agent Tokens | Planning Retry Reserve |
| --- | ---: | ---: |
| Epic 00 Docker Runtime Foundation | 80k-135k | Up to 35k |
| Epic 01 Foundation and Contracts | 275k-465k | Up to 125k |
| Epic 02 Strict Repair Engine | 720k-1,205k | Up to 390k |
| Epic 03 Worker and Validation | 470k-790k | Up to 225k |
| Epic 04 Core Workspace and Shared UI | 445k-760k | Up to 220k |
| Epic 05 Repair Experience | 340k-590k | Up to 200k |
| Epic 06 Format, Convert, and Schema | 500k-875k | Up to 270k |
| Epic 07 Result Views and Output | 330k-570k | Up to 180k |
| Epic 08 Product UI, Accessibility, and Responsive | 460k-785k | Up to 245k |
| Epic 09 E2E, Performance, and Release | 520k-905k | Up to 305k |
| **Project Base Estimate** | **4,140k-7,080k** | **Up to 2,195k** |

Before a task starts, the Orchestrator refines its plan estimate using exact
routing, provider billing dimensions, current pricing, and known comparable
work. If the refined estimate exceeds the task's planned upper bound, the
Orchestrator must update the epic plan and record the reason before starting
the Worker.

## 7. Global Execution Policy

### 7.1 Epic Entry Gate

Before applying the entry gate, the Project Orchestrator must show the
mandatory Epic Start Reminder from `AGENTS.md` and wait for clear user
approval. No epic report, task brief, task report, Worker execution, or
implementation edit may begin before that approval.

An epic may start only when:

- Every required dependency milestone is accepted.
- Its detailed epic file has no unresolved conflict with the BRD or PRD.
- Its detailed epic file contains an implementation-plan usage estimate and
  planning retry reserve for every task.
- The Project Orchestrator selects its first dependency-safe task.
- The Orchestrator creates a task brief with exact workflow, reviewers, file
  ownership, agent routing, tests, and verification commands.
- The Orchestrator creates the epic execution report when the epic first
  starts and creates the selected task's execution report before its Worker
  starts.
- No active Worker owns the same files or shared contracts.

Inside each epic, numbered tasks run in numeric order unless the epic explicitly
allows a different order. The Orchestrator may parallelize steps or tasks only
after recording that they have no unfinished dependency and no overlapping
files or shared contracts.

### 7.2 Task Execution

For every task:

1. Project Orchestrator creates the task execution report, copies the source
   implementation-plan estimate, records planned routing, refines estimated
   usage and cost, and records the report paths in the task brief.
2. Worker defines the exact verification before editing.
3. For behavior code and bug fixes, Worker writes the required failing test and
   confirms the expected failure.
4. For configuration or documentation work, Worker records the focused check
   that will prove the change.
5. Worker implements only the assigned behavior.
6. Worker runs focused tests, type checking, and other required verification.
7. Worker sends a handoff with changed files, results, limits, review risks,
   and available execution-usage details.
8. Required specialist reviewers, when any, inspect the work and report
   available execution-usage details.
9. Worker fixes accepted findings and specialist reviewers re-check affected
   areas.
10. Project Orchestrator records every execution, completes the task report,
    and updates the epic report.
11. Project Orchestrator verifies the task and marks its epic checkbox complete.

Documentation-only tasks use the documentation workflow in
`doc/agent-workflow.md`.

### 7.3 Review Policy

Normal tasks require Code Reviewer and Project Orchestrator acceptance.

Repair-sensitive tasks also require:

- Repair Safety Reviewer.

User-facing visual, interaction, responsive, focus, or accessibility tasks also
require:

- UI Reviewer.

UI-only tasks require UI review instead of Code review. Repair-sensitive UI
tasks require both Repair Safety and UI Reviewers. Release tasks require a
Release Reviewer plus only the specialist reviewers needed by the task.

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
- Every task execution report is complete and the epic execution report shows
  estimated and actual-or-unavailable cost results.
- The roadmap status is changed to `Accepted`.

### 7.7 Execution Reporting

Every task and epic must follow `doc/execution-reports/README.md`.

- Create one task report for each task.
- Create one epic report that summarizes all task reports.
- Set task and epic usage estimates in the implementation plans before
  execution.
- Preserve the source implementation-plan estimate when refining a task
  estimate before execution.
- Record planned provider and model routing before execution.
- Record the actual provider and exact model used for every Orchestrator,
  Worker, Reviewer, retry, fallback, and rework execution.
- Keep estimated cost, calculated usage cost, API-equivalent cost, and billed
  cost separate.
- Calculate provider-neutral cost using only usage dimensions and rates that
  the provider charges.
- Never guess actual usage or cost. Use `Unavailable` with a reason when exact
  evidence is missing.
- The Project Orchestrator owns report updates and must update the epic report
  before accepting each task.

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
- [ ] The app runs through one Docker Compose app service using one container.
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
- [ ] Every task execution report and epic execution report is complete.
- [ ] The approved light prototype and PRD prototype exceptions are followed.
- [ ] Final verification passes:

```bash
npm run lint
npm run format:check
npm run architecture
npm run typecheck
npm test -- --run
npm run build
docker compose config
npx playwright test
```
