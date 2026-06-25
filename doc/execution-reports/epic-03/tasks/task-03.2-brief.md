# Task Brief: Implement Strict Diagnostics

## Source Epic
- `doc/implementation.md`: Epic 03 Worker and Validation
- `doc/implementation/epic-03-worker-and-validation.md`

## Source Task
- Task 03.2 Implement Strict Diagnostics

## Required Workflow
- Normal Task

## Workflow Reason
- Strict diagnostics is focused non-UI parsing logic with no repair-rule change
  and no user-facing visual change. Epic 03 review policy requires Code Reviewer
  approval for Task 03.2; no Repair Safety or UI reviewer is required (the task
  only CALLS the accepted pure engine for eligibility, it does not change repair
  logic or contracts).

## Required Specialist Reviewers
- Code Reviewer

## Agent Routing
- Provider: Anthropic
- Role: Task Worker (normal implementation)
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: claude-sonnet-4-6
- Billing type: Subscription
- Processing tier: Not applicable
- Routing reason: Focused parser-to-diagnostic mapping against an accepted
  contract; no repair-rule or shared-protocol change. Tier B Medium is
  sufficient; Code Reviewer is Tier A High.
- Allowed tools: Read, Edit/Write owned files, Bash for focused tests and
  typecheck
- Required context: `AGENTS.md`, `doc/agent-workflow.md`,
  `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this brief,
  the Epic 03 plan, `doc/prd.md` sections 7 and 8.1, `src/domain/diagnostics.ts`,
  `src/domain/workerProtocol.ts`, `src/domain/result.ts`,
  `src/engine/repair/analyzeJson.ts`, `src/worker/json.worker.ts`
- Retry limit: 1 retry per failed implementation or unresolved finding
- Escalation trigger: a worker-protocol or domain contract must change, or
  diagnostics cannot be produced from confirmed parser errors only, or the task
  fails twice
- Fallback: same-tier `claude-sonnet-4-6`; escalate to Tier A `claude-opus-4-8`
  if the worker-engine eligibility seam proves risky

## Execution Reporting
- Task report: `doc/execution-reports/epic-03/tasks/task-03.2.md`
- Epic report: `doc/execution-reports/epic-03/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 85k-140k
- Implementation-plan retry reserve: Up to 40k
- Refined estimated usage: Unavailable (subscription runner does not expose
  per-run token usage)
- Refined estimated usage cost: Unavailable: subscription runner billing
  dimensions are not exposed
- Refinement basis: Comparable focused engine/worker tasks on this subscription
  runner expose no per-run usage.
- Plan variance: Within plan
- Retry reserve: Up to 40k estimated agent tokens
- Report owner: Project Orchestrator

## Goal
Produce reliable strict JSON diagnostics (plain message, offset, line, column,
reliability, and repair state) for the current source, present only confirmed
errors, and support ephemeral result-text validation without altering the
stored protected source.

## Required Reading
- `AGENTS.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- `doc/implementation/epic-03-worker-and-validation.md` (Task 03.2)
- `doc/prd.md` sections 7 (Validation) and 8.1 (Repair JSON eligibility)
- `src/domain/diagnostics.ts`, `src/domain/workerProtocol.ts`,
  `src/domain/result.ts`, `src/engine/repair/analyzeJson.ts`,
  `src/worker/json.worker.ts`

## Dependencies
- Task 03.1 Revision-Based Worker Communication (Accepted)

## Required Contracts and Interfaces
- Produce `Diagnostic` values exactly per `src/domain/diagnostics.ts`
  (`code`, `message`, `position{offset,line,column}`, `reliability`,
  `repairState`, `severity`). Do NOT change the contract.
- Use the existing `WorkerResponse` `source-validated` and
  `result-validation-complete` shapes without changing `workerProtocol.ts`. Any
  required contract change stops and escalates to the Orchestrator.
- Use `jsonc-parser` (already a dependency) configured to DISALLOW comments and
  DISALLOW trailing commas, so they are reported as errors.

## Dependency Boundaries
- `src/worker/` may import `src/domain/`, `src/engine/`, `src/lib/`, and the
  `jsonc-parser` dependency. No React/DOM/CodeMirror.
- No circular imports; no deep cross-feature private imports.
- Diagnostics must not duplicate or alter repair-rule logic. Repair decisions
  come only from the engine's `classifyRepairEligibility()`.

## File Ownership
- Create: `src/worker/diagnostics.ts`
- Create: `tests/worker/diagnostics.test.ts`
- Modify: `src/worker/json.worker.ts` (only the `set-source` path and the new
  `validate-result` handling — replace the empty-diagnostics placeholder and the
  stand-in eligibility probe code with real diagnostics and engine eligibility
  derived from the top confirmed diagnostic's code; do not change revision/job/
  stale logic)

## Do Not Change
- `src/domain/**` (shared contracts)
- `src/engine/repair/**` (accepted engine)
- `src/hooks/useWorkerClient.ts`
- `tests/worker/protocol.test.ts` (Task 03.1 tests must keep passing unchanged)
- Report files (Orchestrator-owned)

## Required Behavior
- Parse the source with `jsonc-parser` with comments and trailing commas
  disallowed. Map each CONFIRMED parser error to a `Diagnostic` with a plain
  human-readable message (e.g. "Missing comma at line 3.", "Expected a colon
  after a property name.", "This object is missing a closing brace."), the exact
  `offset`, and computed 1-based `line` and `column`.
- Mark reliably located errors `reliability: "confirmed"`. Mark errors that are
  only uncertain follow-on consequences `reliability: "uncertain-follow-on"` and
  never present them as confirmed.
- Set `severity` appropriately (syntax errors are `"error"`).
- Set `repairState` from the engine: `not-applicable` for valid input;
  otherwise `eligible` when `classifyRepairEligibility()` reports the
  diagnostic's code eligible, else `manual`. Do not invent repair state.
- `set-source` in `json.worker.ts` returns `source-validated` with the real
  confirmed diagnostics and engine `eligibility` derived from the top confirmed
  diagnostic's code (replacing the Task-03.1 stand-in). Keep all revision/job/
  stale behavior from Task 03.1 unchanged.
- Implement the `validate-result` request: validate the provided
  `ResultDocument` text strictly and return `result-validation-complete` with
  `valid`. This validation is ephemeral and must NOT replace or mutate the
  stored protected source revision.
- Every valid top-level JSON type (object, array, string, number, boolean,
  null) validates with zero confirmed errors.

## Required Tests (`tests/worker/diagnostics.test.ts`)
- Each valid top-level JSON type produces zero confirmed diagnostics.
- Missing comma, trailing comma, and an uncertain follow-on case produce the
  expected diagnostics; the follow-on is not marked `confirmed`.
- Comments and trailing commas are reported as errors (disallowed).
- A confirmed error maps to the correct plain message, offset, line, and column.
- `validate-result` returns `valid: true` for valid result text and
  `valid: false` for invalid result text, and does not change the stored source
  (assert via a following `analyze-repair` still using the stored revision).

## Verification Commands
```bash
npm test -- --run tests/worker/diagnostics.test.ts tests/worker/protocol.test.ts
npm run typecheck
npm run architecture
npm run lint
```

## Handoff Requirements
- Changed files with one-line reasons
- Each verification command and PASS/FAIL result (paste failing output if any)
- Confirmation no domain or worker-protocol contract was changed
- Confirmation Task 03.1 protocol tests still pass unchanged
- Confirmation repair decisions come only from the engine
- Known limitations and open questions
- `Agent Routing Used` and `Execution Usage` blocks per
  `doc/agent-workflow.md` section 6 (report `Unavailable` for usage with the
  subscription-runner reason; do not guess)
