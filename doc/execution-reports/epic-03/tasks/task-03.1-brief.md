# Task Brief: Implement Revision-Based Worker Communication

## Source Epic
- `doc/implementation.md`: Epic 03 Worker and Validation
- `doc/implementation/epic-03-worker-and-validation.md`

## Source Task
- Task 03.1 Implement Revision-Based Worker Communication

## Required Workflow
- Repair-Sensitive Task

## Workflow Reason
- The worker delegates repair eligibility and repair analysis to the pure
  engine. Per Epic 03 review policy, Task 03.1 requires both a Code Reviewer and
  a Repair Safety Reviewer to confirm the worker delegates to the pure engine
  and never bypasses its verification or duplicates repair rules.

## Required Specialist Reviewers
- Repair Safety Reviewer
- Code Reviewer

## Agent Routing
- Provider: Anthropic
- Role: Task Worker (shared contracts / architecture)
- Capability tier: Tier A
- Reasoning level: High
- Exact model for this run: claude-opus-4-8
- Billing type: Subscription
- Processing tier: Not applicable
- Routing reason: Worker lifecycle, revision/job state, stale-response policy,
  and the worker-to-pure-engine safety boundary carry cross-boundary mistake
  risk; routing doc marks worker-protocol and repair-delegation work Tier A.
- Allowed tools: Read, Edit/Write owned files, Bash for focused tests and
  typecheck
- Required context: `AGENTS.md`, `doc/agent-workflow.md`,
  `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this brief,
  the Epic 03 plan, `src/domain/workerProtocol.ts`, `src/domain/repair.ts`,
  `src/domain/diagnostics.ts`, `src/engine/repair/analyzeJson.ts`
- Retry limit: 1 retry per failed implementation or unresolved finding
- Escalation trigger: repair delegation cannot be proven engine-pure, a shared
  contract must change, or the task fails twice
- Fallback: same-tier `claude-opus-4-8`; no lower-tier fallback for this Tier A
  work

## Execution Reporting
- Task report: `doc/execution-reports/epic-03/tasks/task-03.1.md`
- Epic report: `doc/execution-reports/epic-03/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 105k-170k
- Implementation-plan retry reserve: Up to 50k
- Refined estimated usage: Unavailable (subscription runner does not expose
  per-run token usage)
- Refined estimated usage cost: Unavailable: subscription runner billing
  dimensions are not exposed
- Refinement basis: Comparable Epic 02 worker-adjacent tasks ran on a
  subscription runner with no exposed per-run usage; same condition applies.
- Plan variance: Within plan
- Retry reserve: Up to 50k estimated agent tokens
- Report owner: Project Orchestrator

## Goal
Establish one revision-based, job-tracked communication path between the main
thread and a single Web Worker, where stale jobs and stale revisions are
ignored and repair work delegates only to the pure engine.

## Required Reading
- `AGENTS.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- `doc/implementation.md` (sections 3.3, 8, 9)
- `doc/implementation/epic-03-worker-and-validation.md` (Task 03.1)
- `doc/prd.md` sections 6, 7, 8.1, 13, 17

## Dependencies
- Epic 01 Foundation and Contracts (Accepted)
- Epic 02 Strict Repair Engine (Accepted, Repair Safety Approved)
- Accepted contracts: `src/domain/workerProtocol.ts`, `src/domain/repair.ts`,
  `src/domain/diagnostics.ts`, `src/domain/result.ts`

## Required Contracts and Interfaces
- Use the existing `WorkerRequest` / `WorkerResponse` discriminated unions from
  `src/domain/workerProtocol.ts` without changing them. Any required change to
  the worker protocol is a shared-contract change and must stop and escalate to
  the Project Orchestrator first.
- Define a small injectable `WorkerLike` boundary interface (post/onmessage/
  terminate) in `src/hooks/useWorkerClient.ts` so tests substitute a fake
  worker without a real browser Worker.

## Dependency Boundaries
- `src/worker/` may import `src/domain/`, `src/engine/`, and `src/lib/`.
- `src/worker/` must not import React, DOM-only UI, or CodeMirror.
- `src/hooks/` may import `src/domain/` and `src/worker/` types, plus React.
- No circular imports. No deep imports into another feature's private files.
- The worker must call the pure engine; it must not contain or duplicate any
  repair rule, candidate generation, verification, or fingerprint logic.

## File Ownership
- Create: `src/worker/json.worker.ts`
- Create: `src/hooks/useWorkerClient.ts`
- Create: `tests/worker/protocol.test.ts`
- Modify: `doc/execution-reports/epic-03/tasks/task-03.1.md` is Orchestrator-owned
  — do NOT edit; report execution details in the handoff instead.

## Do Not Change
- `src/domain/**` (shared contracts)
- `src/engine/repair/**` (accepted repair engine)
- `src/worker/diagnostics.ts` (Task 03.2 owns strict diagnostics)
- Any file not listed under File Ownership

## Required Behavior
- Make the worker request handler a pure, exported, synchronous-or-async
  function (e.g. `handleWorkerRequest(state, request)` returning the next state
  and the `WorkerResponse` to post) so it is unit-testable without a real
  Worker. Attach `self.onmessage` glue only when running in a worker context.
- Maintain worker state: the latest stored `WorkerSourceRevision` (document text
  and its revision number) and the latest accepted revision.
- `set-source`: store the document and its revision; produce a
  `source-validated` response for that revision. For this task, source
  validation may use a minimal real validity check plus
  `classifyRepairEligibility()` from the engine to populate `eligibility`; deep
  strict diagnostics mapping is Task 03.2. Do not return invented diagnostics.
- `analyze-repair`: only valid against the stored latest revision. If the
  request's source revision does not match the stored latest revision, return
  the `failed` response with a clear stale-revision message and the stored
  revision. When it matches, delegate to `analyzeJsonRepair()` from the engine
  and return its `safe` / `ambiguous` / `manual` result unchanged in a
  `repair-analysis-complete` response.
- An unknown / older revision action must never run against current input.
- Increase `jobId` (the request `id`) for every request; increase `revision`
  only when input changes.
- Client (`useWorkerClient`): assign a monotonically increasing job id per
  request, track the current revision, post requests to the injected
  `WorkerLike`, and ignore any response whose job id is older than the latest
  in-flight job or whose revision is older than the current revision. Terminate
  the worker on unmount.

## Required Tests (`tests/worker/protocol.test.ts`)
- Stale revision: `analyze-repair` against an older revision returns the
  stale/failed response and does not call the engine analysis path.
- Stored revision: after `set-source`, the worker uses the stored latest
  revision for a matching `analyze-repair`.
- Unknown revision: an action referencing a revision the worker never stored is
  rejected, not executed against current input.
- Repair-engine delegation: a matching `analyze-repair` returns exactly the
  pure engine `analyzeJsonRepair()` result (assert the worker does not
  re-derive or alter it).
- Regression: the worker module contains no repair-rule logic — delegation only.
- Client stale handling: `useWorkerClient` ignores responses from superseded
  job ids and superseded revisions; it surfaces only the latest.
- Client lifecycle: the client terminates the injected worker on unmount.

## Verification Commands
```bash
npm test -- --run tests/worker/protocol.test.ts
npm run typecheck
npm run architecture
```

## Handoff Requirements
- Changed files with one-line reasons
- Each verification command and its PASS/FAIL result (paste failing output if
  any)
- Confirmation the worker protocol contract was not changed
- Confirmation repair work delegates only to the pure engine
- Known limitations (e.g. minimal source validation deferred to Task 03.2)
- Open questions
- `Agent Routing Used` and `Execution Usage` blocks per
  `doc/agent-workflow.md` section 6 (report `Unavailable` for usage with the
  subscription-runner reason; do not guess)
