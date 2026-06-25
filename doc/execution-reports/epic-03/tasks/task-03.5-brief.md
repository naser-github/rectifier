# Task Brief: Expose Repair Analysis Safely

## Source Epic
- `doc/implementation.md`: Epic 03 Worker and Validation
- `doc/implementation/epic-03-worker-and-validation.md`

## Source Task
- Task 03.5 Expose Repair Analysis Safely

## Required Workflow
- Repair-Sensitive Task (with required Code review AND Repair Safety review)

## Workflow Reason
- Defines the worker-to-engine safety boundary for repair: automatic eligibility
  classification versus user-triggered candidate generation. Epic 03 policy
  requires Code Reviewer approval and Repair Safety Reviewer confirmation that the
  worker delegates to the pure engine and never bypasses its verification.

## Required Specialist Reviewers
- Code Reviewer (Tier A)
- Repair Safety Reviewer (Tier A)

## Agent Routing
- Provider: Anthropic
- Role: Task Worker
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: claude-sonnet-4-6
- Billing type: Subscription
- Processing tier: Not applicable
- Routing reason: The runtime safety boundary already exists from Tasks 03.1/03.2
  (set-source delegates to `classifyRepairEligibility`; `analyze-repair` delegates
  to `analyzeJsonRepair`). This task adds behavioral safety regression tests and
  confirms the boundary; no repair-rule or shared-protocol change. Both reviewers
  are Tier A.
- Allowed tools: Read, Edit/Write owned files, Bash for focused tests, typecheck,
  build
- Required context: `AGENTS.md`, `doc/agent-workflow.md`,
  `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this brief, the
  Epic 03 plan, `doc/prd.md` sections 7, 8.1, 13, 15, 17, `src/worker/json.worker.ts`,
  `src/engine/repair/analyzeJson.ts`, `src/domain/repair.ts`,
  `src/domain/workerProtocol.ts`, `tests/worker/protocol.test.ts`,
  `tests/engine/repair.test.ts`
- Retry limit: 1 retry per failed implementation or unresolved finding
- Escalation trigger: a contract must change, the engine must change, or a safety
  property cannot be proven without bypassing the engine — then STOP and escalate
  to Tier A `claude-opus-4-8`
- Fallback: escalate to Tier A `claude-opus-4-8` on repeated failure

## Execution Reporting
- Task report: `doc/execution-reports/epic-03/tasks/task-03.5.md`
- Epic report: `doc/execution-reports/epic-03/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 110k-190k
- Implementation-plan retry reserve: Up to 60k
- Refined estimated usage: Unavailable (subscription runner does not expose
  per-run token usage)
- Refined estimated usage cost: Unavailable: subscription runner billing
  dimensions are not exposed
- Refinement basis: Most of the runtime boundary is already in place; the residual
  work is behavioral safety tests + dual review. Subscription runner exposes no
  per-run usage.
- Plan variance: Within plan
- Retry reserve: Up to 60k estimated agent tokens
- Report owner: Project Orchestrator

## Goal
Prove and lock in the repair safety boundary in the worker:
1. After confirmed-invalid diagnostics, the automatic path calls the pure
   `classifyRepairEligibility()` for the current revision only and returns
   supported-rule eligibility METADATA — never a candidate, result, preview, or
   dialog.
2. Candidates are generated and verified ONLY on the explicit user-triggered
   `analyze-repair` request, which delegates to the pure `analyzeJsonRepair()` and
   returns only the accepted `safe` / `ambiguous` / `manual` result.
3. The worker contains no repair-rule logic of its own.

## Required Reading
- `AGENTS.md` (esp. §4 boundaries, repair-safety rules, no dead code)
- `doc/agent-workflow.md`, `doc/agent-model-routing.md`,
  `doc/execution-reports/README.md`
- `doc/implementation/epic-03-worker-and-validation.md` (Task 03.5)
- `doc/prd.md` sections 7, 8.1, 13, 15, 17 (repair safety, never invent/alter data)
- `src/worker/json.worker.ts`, `src/engine/repair/analyzeJson.ts`,
  `src/domain/repair.ts`, `src/domain/workerProtocol.ts`
- `tests/worker/protocol.test.ts`, `tests/engine/repair.test.ts`

## Dependencies
- Tasks 03.1 (worker protocol + delegation), 03.2 (diagnostics) — Accepted

## Required Contracts and Interfaces
- Consume the engine API (`classifyRepairEligibility`, `analyzeJsonRepair`) and the
  worker protocol AS-IS. Do NOT change `src/domain/**`, `src/engine/**`, or the
  worker-protocol contract; escalate if a change seems necessary.

## Dependency Boundaries
- The worker delegates ALL repair decisions to the pure engine. It must not
  embed, duplicate, or shortcut any repair rule, candidate generation, or
  verification.
- The automatic (`set-source`) path may classify eligibility only; it must never
  generate, verify, select, show, preview, or apply a candidate, create a result,
  or open a dialog.

## File Ownership
- Edit (preferred) or create: a worker repair-safety test. Either extend
  `tests/worker/protocol.test.ts` or create
  `tests/worker/repairSafety.test.ts` — owned by this task.
- Only touch `src/worker/json.worker.ts` if a genuine safety gap is found; the
  current implementation is expected to already satisfy the boundary, so prefer
  NO source change and justify it in the handoff.

## Do Not Change
- `src/domain/**`, `src/engine/**`, `src/hooks/**`, `src/lib/**`,
  `src/components/**`, `src/styles/**`, `src/app/**`
- The worker-protocol contract and the repair engine
- Existing unrelated tests; report files (Orchestrator-owned)

## Required Behavior to Prove (tests)
- `set-source` on confirmed-invalid input returns a `source-validated` response
  whose `eligibility` is metadata only (`RepairEligibility`) and carries NO
  candidate / repairedText / edits / result / dialog. Assert the response kind is
  `source-validated`, never `repair-analysis-complete`.
- `set-source` calls the engine for the CURRENT revision's text only.
- `analyze-repair` is the only path that yields `repair-analysis-complete`, only
  for a matching stored revision, and its `analysis` equals
  `analyzeJsonRepair(storedText)` exactly (safe/ambiguous/manual).
- Stale `analyze-repair` (revision mismatch) returns `failed` and produces no
  candidate.
- Regression: the worker module contains no repair-rule/candidate-generation/
  verification symbols of its own (keep/strengthen the existing source-scan test).
- Valid JSON yields `valid-json` eligibility and no candidate.

## Required Tests
- Add the behavioral safety assertions above. Reuse existing helpers in
  `tests/worker/protocol.test.ts` where possible; do not duplicate coverage
  pointlessly. Every new test must be non-vacuous (assert on real distinguishable
  values, not tautologies).

## Verification Commands
```bash
npm test -- --run tests/worker/protocol.test.ts tests/worker/diagnostics.test.ts
npm test -- --run
npm run typecheck
npm run architecture
npm run lint
npm run format:check
npm run build
```

## Handoff Requirements
- Changed files with one-line reasons (state explicitly if no source file changed
  and why that is safe)
- Each verification command and PASS/FAIL result (paste failing output if any)
- Confirmation no domain/engine/worker-protocol contract was changed
- Explicit mapping of each Task 03.5 checklist item to the proving test or
  existing code
- Repair-safety notes: how the automatic path is provably candidate-free and how
  candidate generation is gated behind the user-triggered request
- Known limitations and open questions
- `Agent Routing Used` and `Execution Usage` blocks per `doc/agent-workflow.md`
  section 6 (report `Unavailable` for usage with the subscription-runner reason)
