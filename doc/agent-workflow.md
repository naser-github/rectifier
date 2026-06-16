# Rectifier Agent Workflow

## 1. Purpose

Rectifier uses a verification-gated workflow for every task and independent
specialist review only where the task risk requires it.

The goal is to prevent:

- Unsafe JSON repair behavior.
- Missing product requirements.
- Architecture violations.
- Duplicate or conflicting agent changes.
- Tasks being marked complete without verification.
- Tasks and epics finishing without estimated and actual-or-unavailable
  execution-cost evidence.

The master epic order and global execution rules are defined in
`doc/implementation.md`. Exact implementation tasks are defined in the assigned
file under `doc/implementation/`. Coding standards are defined in `AGENTS.md`.
Agent model, reasoning, context, tool, retry, and fallback rules are defined in
`doc/agent-model-routing.md`.
Execution report ownership, cost terms, templates, and calculation rules are
defined in `doc/execution-reports/README.md`.

## 2. Core Workflow

Every normal implementation task uses:

```text
Project Orchestrator
        |
        v
Task Worker
        |
        v
Code Reviewer
        |
        v
Task Worker fixes findings
        |
        v
Code Reviewer re-checks affected areas
        |
        v
Project Orchestrator verifies and accepts the task
```

A task is complete only when:

```text
Worker verification passes
+ Code Reviewer approves
+ Project Orchestrator verification passes
+ Task execution report is complete
+ Epic execution report is updated
```

## 3. Roles

### 3.1 Project Orchestrator

Use one Project Orchestrator for the complete project.

Responsibilities:

- Read `AGENTS.md`, BRD, PRD, approved prototype, master roadmap, assigned epic
  plan, this workflow, and `doc/agent-model-routing.md`.
- Select the next task using the required epic order and dependency gates.
- Confirm task dependencies are complete.
- Select the required workflow and every required specialist reviewer, when
  any.
- Select agent routing using `doc/agent-model-routing.md`.
- Create the task brief.
- Confirm the assigned epic plan contains the task's implementation-plan usage
  estimate and planning retry reserve.
- Create the task execution report, preserve the implementation-plan estimate,
  and record refined routing, estimated usage cost, and retry reserve before
  starting the Worker.
- Assign non-overlapping file ownership.
- Start the Worker and Reviewers.
- Record every Orchestrator, Worker, Reviewer, retry, fallback, and rework
  execution in the task report.
- Resolve reviewer disagreements using document priority.
- Check the completed task against the BRD, PRD, prototype, roadmap, assigned
  epic, and task brief.
- Run final task verification.
- Review the final diff.
- Update completed epic-plan checkboxes only after acceptance.
- Update the epic execution report before accepting each task.
- Accept an epic only after its exit gate and milestone review pass.
- Update the epic status in the master roadmap only after epic acceptance.
- Prevent agents from changing unrelated files.

The Project Orchestrator should not normally implement feature code. It may make
small integration or documentation fixes after review when that is safer than
starting another Worker.

Before starting an epic, the Project Orchestrator must show this reminder and
wait for clear user approval:

```text
Ready to start Epic [number]: [name]

- Exit milestone: [milestone]
- Dependencies and entry gates: [status]
- Epic token budget: [range]
- Planning retry reserve: [amount]
- Epic report: [planned path]
- First task: [task number and name]
- First task brief: [planned path]
- First task report: [planned path]

After approval:
1. Create the epic execution report.
2. Copy the epic planning budget.
3. Prepare the first task brief.
4. Select exact agents and models.
5. Create the first task execution report.
6. Refine the first task usage and cost estimate.

Start this epic?
```

The Orchestrator must not create these artifacts, dispatch agents, edit
implementation files, or start the first Worker until the user approves.

### 3.2 Task Worker

Use one Worker as the owner of a task.

Responsibilities:

- Read the task brief and required documents.
- Inspect existing code before editing.
- Write failing tests first for repair rules and bug fixes.
- Implement only the assigned task.
- Follow architecture and component boundaries in `AGENTS.md`.
- Run task-specific verification.
- Provide a handoff report.
- Fix reviewer findings.

The Worker must not:

- Change product scope.
- Weaken tests to make them pass.
- Edit files outside assigned ownership without Orchestrator approval.
- Mark the task complete.

### 3.3 Code Reviewer

The Code Reviewer checks:

- Correctness and regressions.
- Architecture boundaries.
- TypeScript safety.
- Correct `interface` and `type` usage for public contracts and unions.
- Dependency direction, circular imports, and cross-feature private imports.
- Naming consistency with product and domain terms.
- Component reuse and file responsibilities.
- Duplicate logic.
- Explicit result modeling and error handling.
- Side-effect isolation and replaceable boundary interfaces.
- Magic values, dead code, commented-out code, and premature abstractions.
- Test quality.
- Accessibility implementation.
- Performance and large-file risk.
- Security and unsafe HTML handling.

The Code Reviewer does not redesign the product or add optional features.

### 3.4 Repair Safety Reviewer

Add a Repair Safety Reviewer for any task that changes:

- `src/engine/repair/`
- Repair-related domain contracts.
- Repair worker messages.
- Candidate verification.
- Repair preview or ambiguous-choice behavior.

The Repair Safety Reviewer checks:

- Original input remains unchanged.
- No user data is invented, removed, reordered, or changed.
- Repair eligibility classification never generates, verifies, selects, or
  exposes a repair candidate.
- Full candidate generation and verification begin only after the user clicks
  Repair JSON.
- Eligibility false positives continue to manual guidance without applying a
  repair.
- Candidate semantic and exact-source data-token fingerprints match.
- Syntax edits do not overlap protected key or value content.
- Complete repaired JSON is strictly valid.
- Ambiguous choices are never automatically selected.
- Unsafe input returns manual guidance.
- Safe, refusal, ambiguous, and data-preservation tests exist.

A Repair Safety Reviewer rejection blocks the task.

### 3.5 UI Reviewer

Add a UI Reviewer for Epic 08 and any task that changes user-facing visual,
interaction, responsive, focus, or accessibility behavior.

The UI Reviewer checks:

- The approved prototype and PRD prototype exceptions.
- Desktop and mobile layout behavior.
- Prompt and monospace typography use.
- Paper texture, colors, borders, radiuses, and interaction states.
- Action placement and order.
- Keyboard, focus, disabled-reason, and responsive behavior.

The UI Reviewer does not change product behavior or override safety rules.

### 3.6 Release Reviewer

Add a Release Reviewer for Epic 09.

The Release Reviewer checks:

- Complete BRD and PRD traceability.
- Full verification output.
- Browser flow and large-file evidence.
- Recorded performance results and accepted limits.
- Verified `doc/RUN.md` commands.
- Unresolved findings and release blockers.

Release Reviewer approval does not replace a specialist review required by the
release task's risk.

## 4. Workflow Types

### Workflow Selection Rules

The Project Orchestrator selects the workflow before assigning a Worker.

- The Project Orchestrator performs requirements review for every task.
- Add Code review for normal implementation, shared contracts, architecture,
  repair code, and other complex non-UI logic.
- Add Repair Safety review for repair engine, repair contracts, repair worker
  messages, repair state, repair eligibility, or repair UX.
- Add UI review for user-facing visual, interaction, responsive, focus, or
  accessibility behavior.
- Use Repair-Sensitive UI when both repair and UI rules apply.
- Use Release Workflow for Epic 09 and add only the specialist reviewers
  required by that release task.
- Never use Small Task or Documentation-Only Task to avoid a required
  specialist reviewer.
- When multiple specialist rules apply, include every required specialist
  reviewer.

### 4.1 Normal Task

Use for most implementation tasks:

```text
Orchestrator -> Worker -> Code Reviewer -> Orchestrator
```

### 4.2 Repair-Sensitive Task

Use for repair engine and repair behavior:

```text
Orchestrator
  -> Worker
  -> Repair Safety Reviewer
  -> Code Reviewer
  -> Orchestrator
```

### 4.3 UI Feature Task

Use for a task that creates or changes user-facing visual behavior:

```text
Orchestrator
  -> Worker
  -> UI Reviewer
  -> Orchestrator
```

### 4.4 Repair-Sensitive UI Task

Use for repair dialogs and other user-facing repair behavior:

```text
Orchestrator
  -> Worker
  -> Repair Safety Reviewer
  -> UI Reviewer
  -> Orchestrator
```

### 4.5 Small Task

Use only when the change:

- Touches at most two focused files.
- Does not change product behavior.
- Does not change repair behavior or shared contracts.
- Has low regression risk.

Workflow:

```text
Orchestrator -> Worker -> Orchestrator verification
```

The Orchestrator performs the requirements, diff, and verification checks.

### 4.6 Documentation-Only Task

Use:

```text
Orchestrator -> Documentation Worker -> Orchestrator verification
```

The Orchestrator checks document priority, links, naming, and contradictions.

### 4.7 UI Integration Task

Use for Epic 08:

```text
Orchestrator
  -> Worker
  -> UI Reviewer
  -> Orchestrator
```

### 4.8 Release Workflow

Use for Epic 09:

```text
Orchestrator
  -> Release Worker
  -> Release Reviewer
  -> Required specialist reviewers, when needed
  -> Orchestrator
```

## 5. Task Brief

Before starting a Worker, the Project Orchestrator creates a task brief using
this format:

```markdown
# Task Brief: [Task name]

## Source Epic
- `doc/implementation.md`: Epic [number and name]
- `doc/implementation/epic-[number]-[name].md`

## Source Task
- Task [epic.task number and name]

## Required Workflow
- [Exact workflow name]

## Workflow Reason
- [Why this workflow and its specialist reviewers are required]

## Required Specialist Reviewers
- [Exact reviewer names required by the selected workflow, or `None`]

## Agent Routing
- Provider: [Provider name]
- Role: [Agent role]
- Capability tier: [Tier A, Tier B, or Tier C]
- Reasoning level: [XHigh, High, Medium, or Low]
- Exact model for this run: [Required current model name]
- Billing type: [API, subscription, local, or other]
- Processing tier: [Provider-specific tier or "Not applicable"]
- Routing reason: [Why this tier is sufficient]
- Allowed tools: [Tools]
- Required context: [Documents and contracts]
- Retry limit: [Number]
- Escalation trigger: [Concrete trigger]
- Fallback: [Same-tier or higher-tier model]

## Execution Reporting
- Task report: `doc/execution-reports/epic-[number]/tasks/task-[number].md`
- Epic report: `doc/execution-reports/epic-[number]/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: [Range copied from assigned epic plan]
- Implementation-plan retry reserve: [Amount copied from assigned epic plan]
- Refined estimated usage: [Provider-specific dimensions or token range]
- Refined estimated usage cost: [Amount and currency, or `Unavailable` with
  reason]
- Refinement basis: [Comparable task, routing, planned usage, and pricing
  assumptions]
- Plan variance: [Within plan, or reason the epic plan was updated]
- Retry reserve: [Amount or percentage]
- Report owner: Project Orchestrator

## Goal
[One clear outcome]

## Required Reading
- `AGENTS.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- Relevant BRD sections
- Relevant PRD sections
- Master roadmap
- Assigned epic plan and task
- Approved prototype when UI is involved

## Dependencies
- [Accepted tasks or contracts this task depends on]

## Required Contracts and Interfaces
- [Shared types, public interfaces, boundary interfaces, or none]

## Dependency Boundaries
- [Allowed dependency direction and forbidden imports]

## File Ownership
- Create: `path`
- Modify: `path`
- Test: `path`

## Do Not Change
- [Shared or unrelated files]

## Required Behavior
- [Concrete task requirements]

## Required Tests
- [Concrete tests]

## Verification Commands
```bash
[commands]
```

## Handoff Requirements
- Changed files
- Tests run and results
- Known limitations
- Open questions
```

The brief must use exact paths and cannot contain unresolved placeholder text
or vague instructions. The named workflow and specialist reviewers must match
the assigned epic task and the workflow-selection rules. Agent routing must
follow `doc/agent-model-routing.md`.

## 6. Worker Handoff

The Worker reports:

```markdown
## Worker Handoff

### Workflow Followed
- [Exact workflow name from the task brief]

### Agent Routing Used
- Provider: [Provider name]
- Role: [Agent role]
- Capability tier: [Tier]
- Exact model: [Model name]
- Reasoning level: [Level]
- Billing type: [API, subscription, local, or other]
- Processing tier: [Provider-specific tier or "Not applicable"]
- Retries used: [Number]
- Fallback or escalation used: [Details or "None"]

### Execution Usage
- Execution ID: [Epic, task, role, and run number]
- Reported usage: [Provider-specific usage values or `Unavailable`]
- Usage source: [Runner, provider response, dashboard, or `Unavailable`]
- Usage unavailable reason: [Reason or "None"]

### Implemented
- [Behavior]

### Changed Files
- `path`: [reason]

### Verification
- `[command]`: PASS or FAIL

### Known Limitations
- [Limitation or "None"]

### Reviewer Attention
- [High-risk areas]

### Required Specialist Reviewers
- [Reviewer name]: Pending or Approved, or `None`
```

When specialist review is required, the Orchestrator sends the implementation
and handoff to those reviewers. Specialist reviewers must be separate read-only
agent instances and must not approve their own implementation work.

Every specialist Reviewer handoff must also include the `Agent Routing Used`
and `Execution Usage` fields above. Agents report only usage that their runner
or provider exposes. They must not estimate or guess actual usage.

## 7. Review Findings

Reviewers report findings first, ordered by severity:

```markdown
## Review Findings

### Blocking
- `[file:line]` [finding]
  - Source: `[document section or coding rule]`
  - Required fix: [specific correction]

### Important
- ...

### Minor
- ...

## Approval
- Approved
```

Rules:

- A reviewer cannot approve with unresolved Blocking findings.
- Important findings require fixes unless the Orchestrator records a clear
  reason for deferral.
- Minor findings may be deferred when unrelated to task acceptance.
- Reviewers re-check affected areas after fixes.

## 8. Execution Reports

The Project Orchestrator creates and maintains reports using:

- `doc/execution-reports/templates/task-report.md`
- `doc/execution-reports/templates/epic-report.md`
- `doc/execution-reports/pricing.yml`

During implementation planning, every epic task receives an estimated agent
token range and a separate planning retry reserve. Before execution, the task
report preserves that source estimate and records refined planned roles,
providers, models, usage, cost, and retry reserve.

If the refined estimate exceeds the implementation-plan upper bound, the
Orchestrator updates the epic plan and records the reason before starting the
Worker.

After each execution, the Orchestrator records the execution ID, actual
provider and model, reported usage, applicable pricing entry, calculated cost,
result, and routing-change reason. Estimated values are allowed only when
labeled `Estimated`. Actual usage and actual cost must never be guessed.

Use these cost labels exactly:

- `Estimated usage cost`: pre-execution forecast.
- `Calculated usage cost`: real reported usage multiplied by recorded provider
  prices.
- `API-equivalent cost`: public API price comparison for subscription or other
  non-API execution.
- `Billed cost`: amount proven by a provider invoice or billing dashboard.
- `Unavailable`: exact evidence is not exposed; include the reason.

The task report includes all Worker, Reviewer, Orchestrator, retry, fallback,
and rework executions. The epic report summarizes accepted task reports.
Executions that span multiple tasks must stay as shared epic overhead and must
not be guessed or divided between tasks.
Detailed calculation and provider-neutral rules live in
`doc/execution-reports/README.md`.

## 9. Task Acceptance

The Project Orchestrator accepts a task only after:

1. Every specialist reviewer named in the task brief approves, or the task
   brief records that none is required.
2. Required task tests pass.
3. Type checking passes for affected TypeScript work.
4. The task diff contains no unrelated changes.
5. Required documents and architecture rules are followed.
6. The workflow named in the task brief was followed.
7. Agent routing, retry, and escalation followed `doc/agent-model-routing.md`.
8. No known blocking issue remains.
9. The task's implementation-plan estimate was preserved or its approved
   planning change was recorded.
10. The task execution report is complete, every execution is recorded, and
   missing usage or cost fields contain an `Unavailable` reason.
11. The epic execution report is updated with the task result.

The Orchestrator then:

- Updates the task checkboxes in the assigned epic file.
- Records any accepted limitation.
- Moves to the next dependency-safe task.

### 9.1 Epic Acceptance

The Project Orchestrator accepts an epic only after:

1. Every required task in the epic plan is accepted.
2. The epic verification commands pass.
3. The epic acceptance checklist passes.
4. Required milestone specialist reviewers approve.
5. The epic output and contract handoff are recorded.
6. No unresolved Blocking or unexplained Important finding remains.
7. The epic execution report is complete and reconciles all accepted task
   reports.

The Orchestrator then changes the epic status in `doc/implementation.md` to
`Accepted` and may open dependent epics.

## 10. Parallel Work Rules

Parallel work is allowed only after the Orchestrator confirms:

- Tasks have no dependency on unfinished contracts.
- Agents do not edit the same files.
- Agents do not independently change shared types.
- Each task can be tested separately.

Safe parallel examples:

- UI result views and worker schema validation after contracts are stable.
- Playwright fixture preparation and isolated shared UI primitives.

Unsafe parallel examples:

- Two Workers editing `workspaceReducer.ts`.
- Two Workers changing repair domain contracts.
- UI and Worker agents independently changing the worker protocol.
- Any complete UI work before repair-engine safety approval.

## 11. Shared Contract Changes

Shared contracts include:

- Files under `src/domain/`.
- Worker request and response types.
- Workspace reducer state.
- Repair candidate and verification types.
- Shared UI primitive APIs.

Only the Project Orchestrator may approve a shared contract change.

When a Worker needs one:

1. Stop related parallel work.
2. Report the required contract change.
3. Orchestrator checks affected tasks.
4. Apply and test the contract change.
5. Notify affected agents before work resumes.

## 12. Failure and Escalation Rules

Stop the task and notify the Orchestrator when:

- Requirements conflict.
- The assigned workflow omits a specialist reviewer required by the
  workflow-selection rules.
- The selected model tier is below the minimum required by
  `doc/agent-model-routing.md`.
- The approved prototype conflicts with a safety rule.
- A repair cannot be proven data-preserving.
- A required dependency or browser API is unsuitable.
- The task requires editing files owned by another active Worker.
- Verification fails outside the task's owned area.

Do not silently choose a new product behavior.

## 13. Project Completion

Before declaring Rectifier complete, the Project Orchestrator requires:

- Every epic milestone and implementation task accepted.
- Final Project Orchestrator requirements check against BRD and PRD.
- Final UI review against the approved prototype and prototype exceptions.
- Final repair-safety review.
- Complete verification:

```bash
npm run typecheck
npm test -- --run
npm run build
npx playwright test
```

- Recorded 1 MB, 5 MB, and 10 MB performance results.
- Complete task and epic execution reports.
- No unresolved Blocking or Important findings.
