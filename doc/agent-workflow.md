# Rectifier Agent Workflow

## 1. Purpose

Rectifier uses a review-gated workflow for every implementation task.

The goal is to prevent:

- Unsafe JSON repair behavior.
- Missing product requirements.
- Architecture violations.
- Duplicate or conflicting agent changes.
- Tasks being marked complete without verification.

The master epic order and global execution rules are defined in
`doc/implementation.md`. Exact implementation tasks are defined in the assigned
file under `doc/implementation/`. Coding standards are defined in `AGENTS.md`.

## 2. Core Workflow

Every normal implementation task uses:

```text
Project Orchestrator
        |
        v
Task Worker
        |
        v
Requirements Reviewer
        |
        v
Code Reviewer
        |
        v
Task Worker fixes findings
        |
        v
Reviewers re-check affected areas
        |
        v
Project Orchestrator verifies and accepts the task
```

A task is complete only when:

```text
Worker verification passes
+ Requirements Reviewer approves
+ Code Reviewer approves
+ Project Orchestrator verification passes
```

## 3. Roles

### 3.1 Project Orchestrator

Use one Project Orchestrator for the complete project.

Responsibilities:

- Read `AGENTS.md`, BRD, PRD, approved prototype, master roadmap, assigned epic
  plan, and this workflow.
- Select the next task using the required epic order and dependency gates.
- Confirm task dependencies are complete.
- Create the task brief.
- Assign non-overlapping file ownership.
- Start the Worker and Reviewers.
- Resolve reviewer disagreements using document priority.
- Run final task verification.
- Review the final diff.
- Update completed epic-plan checkboxes only after acceptance.
- Accept an epic only after its exit gate and milestone review pass.
- Update the epic status in the master roadmap only after epic acceptance.
- Prevent agents from changing unrelated files.

The Project Orchestrator should not normally implement feature code. It may make
small integration or documentation fixes after review when that is safer than
starting another Worker.

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

### 3.3 Requirements Reviewer

The Requirements Reviewer checks whether the implementation matches:

- `doc/brd.md`
- `doc/prd.md`
- `doc/ui/rectifier-light-v1.html`
- The master roadmap in `doc/implementation.md`
- The assigned epic and task under `doc/implementation/`
- The task brief

Review focus:

- Missing requirements.
- Wrong behavior.
- UI differences that are not approved prototype exceptions.
- Privacy violations.
- Original-input mutation.
- Missing accessibility behavior.
- Incorrect disabled-state explanations.

The Requirements Reviewer reports findings with:

- Severity.
- Requirement source.
- File and line.
- Expected behavior.

### 3.4 Code Reviewer

The Code Reviewer checks:

- Correctness and regressions.
- Architecture boundaries.
- TypeScript safety.
- Component reuse and file responsibilities.
- Duplicate logic.
- Error handling.
- Test quality.
- Accessibility implementation.
- Performance and large-file risk.
- Security and unsafe HTML handling.

The Code Reviewer does not redesign the product or add optional features.

### 3.5 Repair Safety Reviewer

Add a Repair Safety Reviewer for any task that changes:

- `src/engine/repair/`
- Repair-related domain contracts.
- Repair worker messages.
- Candidate verification.
- Repair preview or ambiguous-choice behavior.

The Repair Safety Reviewer checks:

- Original input remains unchanged.
- No user data is invented, removed, reordered, or changed.
- Candidate semantic and exact-source data-token fingerprints match.
- Syntax edits do not overlap protected key or value content.
- Complete repaired JSON is strictly valid.
- Ambiguous choices are never automatically selected.
- Unsafe input returns manual guidance.
- Safe, refusal, ambiguous, and data-preservation tests exist.

A Repair Safety Reviewer rejection blocks the task.

### 3.6 UI Reviewer

Add a UI Reviewer for Epic 08 and any task that changes the final product
layout or approved visual behavior.

The UI Reviewer checks:

- The approved prototype and PRD prototype exceptions.
- Desktop and mobile layout behavior.
- Prompt and monospace typography use.
- Paper texture, colors, borders, radiuses, and interaction states.
- Action placement and order.
- Keyboard, focus, disabled-reason, and responsive behavior.

The UI Reviewer does not change product behavior or override safety rules.

### 3.7 Release Reviewer

Add a Release Reviewer for Epic 09.

The Release Reviewer checks:

- Complete BRD and PRD traceability.
- Full verification output.
- Browser flow and large-file evidence.
- Recorded performance results and accepted limits.
- Verified `doc/RUN.md` commands.
- Unresolved findings and release blockers.

Release Reviewer approval does not replace Requirements, Code, UI, or Repair
Safety approval.

## 4. Workflow Types

### 4.1 Normal Task

Use for most implementation tasks:

```text
Orchestrator -> Worker -> Requirements Reviewer -> Code Reviewer -> Orchestrator
```

### 4.2 Repair-Sensitive Task

Use for repair engine and repair behavior:

```text
Orchestrator
  -> Worker
  -> Repair Safety Reviewer
  -> Requirements Reviewer
  -> Code Reviewer
  -> Orchestrator
```

### 4.3 Small Task

Use only when the change:

- Touches at most two focused files.
- Does not change product behavior.
- Does not change repair behavior or shared contracts.
- Has low regression risk.

Workflow:

```text
Orchestrator -> Worker -> Combined Reviewer -> Orchestrator
```

The Combined Reviewer performs both requirements and code review.

### 4.4 Documentation-Only Task

Use:

```text
Orchestrator -> Documentation Worker -> Requirements Reviewer -> Orchestrator
```

The reviewer checks document priority, links, naming, and contradictions.

### 4.5 UI Integration Task

Use for Epic 08:

```text
Orchestrator
  -> Worker
  -> Requirements Reviewer
  -> Code Reviewer
  -> UI Reviewer
  -> Orchestrator
```

### 4.6 Release Workflow

Use for Epic 09:

```text
Orchestrator
  -> Release Worker
  -> Requirements Reviewer
  -> Code Reviewer
  -> UI Reviewer
  -> Repair Safety Reviewer
  -> Release Reviewer
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

## Goal
[One clear outcome]

## Required Reading
- `AGENTS.md`
- Relevant BRD sections
- Relevant PRD sections
- Master roadmap
- Assigned epic plan and task
- Approved prototype when UI is involved

## Dependencies
- [Accepted tasks or contracts this task depends on]

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
or vague instructions.

## 6. Worker Handoff

The Worker reports:

```markdown
## Worker Handoff

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
```

The Orchestrator sends the implementation and handoff to reviewers.

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

## 8. Task Acceptance

The Project Orchestrator accepts a task only after:

1. Required reviewers approve.
2. Required task tests pass.
3. Type checking passes for affected TypeScript work.
4. The task diff contains no unrelated changes.
5. Required documents and architecture rules are followed.
6. No known blocking issue remains.

The Orchestrator then:

- Updates the task checkboxes in the assigned epic file.
- Records any accepted limitation.
- Moves to the next dependency-safe task.

### 8.1 Epic Acceptance

The Project Orchestrator accepts an epic only after:

1. Every required task in the epic plan is accepted.
2. The epic verification commands pass.
3. The epic acceptance checklist passes.
4. Required milestone reviewers approve.
5. The epic output and contract handoff are recorded.
6. No unresolved Blocking or unexplained Important finding remains.

The Orchestrator then changes the epic status in `doc/implementation.md` to
`Accepted` and may open dependent epics.

## 9. Parallel Work Rules

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

## 10. Shared Contract Changes

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

## 11. Failure and Escalation Rules

Stop the task and notify the Orchestrator when:

- Requirements conflict.
- The approved prototype conflicts with a safety rule.
- A repair cannot be proven data-preserving.
- A required dependency or browser API is unsuitable.
- The task requires editing files owned by another active Worker.
- Verification fails outside the task's owned area.

Do not silently choose a new product behavior.

## 12. Project Completion

Before declaring Rectifier complete, the Project Orchestrator requires:

- Every epic milestone and implementation task accepted.
- Final requirements review against BRD and PRD.
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
- No unresolved Blocking or Important findings.
