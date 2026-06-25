# Task Brief: Implement Input Size, Upload, and Clear

## Source Epic
- `doc/implementation.md`: Epic 03 Worker and Validation
- `doc/implementation/epic-03-worker-and-validation.md`

## Source Task
- Task 03.3 Implement Input Size, Upload, and Clear

## Required Workflow
- UI Feature Task (with added Code review)

## Workflow Reason
- The task produces user-facing input behavior (10 MB limit messaging, `.json`
  upload, clear request) which requires UI review per the Epic 03 policy, AND
  non-trivial boundary logic (encoded byte-size measurement, pre-read file
  rejection) which requires Code review. Per the workflow-selection rules, when
  multiple specialist rules apply, include every required specialist reviewer.

## Required Specialist Reviewers
- UI Reviewer
- Code Reviewer

## Agent Routing
- Provider: Anthropic
- Role: Task Worker (UI feature / normal implementation)
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: claude-sonnet-4-6
- Billing type: Subscription
- Processing tier: Not applicable
- Routing reason: Focused browser-boundary and pure size logic against accepted
  constraints; no repair or shared-protocol change. Code Reviewer is Tier A.
- Allowed tools: Read, Edit/Write owned files, Bash for focused tests and
  typecheck
- Required context: `AGENTS.md`, `doc/agent-workflow.md`,
  `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this brief,
  the Epic 03 plan, `doc/prd.md` sections 6 (Input), 15 (Performance), 16
  (Accessibility), 17 (Privacy/Security)
- Retry limit: 1 retry per failed implementation or unresolved finding
- Escalation trigger: a domain/worker-protocol contract must change, a browser
  API is unsuitable, or the task fails twice
- Fallback: same-tier `claude-sonnet-4-6`; escalate to Tier A `claude-opus-4-8`
  on repeated failure

## Execution Reporting
- Task report: `doc/execution-reports/epic-03/tasks/task-03.3.md`
- Epic report: `doc/execution-reports/epic-03/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 60k-100k
- Implementation-plan retry reserve: Up to 25k
- Refined estimated usage: Unavailable (subscription runner does not expose
  per-run token usage)
- Refined estimated usage cost: Unavailable: subscription runner billing
  dimensions are not exposed
- Refinement basis: Comparable focused lib/boundary tasks on this subscription
  runner expose no per-run usage.
- Plan variance: Within plan
- Retry reserve: Up to 25k estimated agent tokens
- Report owner: Project Orchestrator

## Goal
Provide pure 10 MB input-size logic and a local-only `.json` file-upload
boundary that rejects oversize input before reading, plus the upload and
clear request contracts the Input panel will consume — without sending any
user content off the device.

## Required Reading
- `AGENTS.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- `doc/implementation/epic-03-worker-and-validation.md` (Task 03.3)
- `doc/prd.md` sections 6, 15, 16, 17
- `src/domain/workerProtocol.ts` (for `WorkerSourceRevision` shape — reference only)

## Dependencies
- Task 03.1 Revision-Based Worker Communication (Accepted)
- Task 03.2 Strict Diagnostics (Accepted)

## Required Contracts and Interfaces
- Define small LOCAL boundary types in `src/lib/` (not in `src/domain/`):
  - A discriminated `FileReadResult` union: accepted (text + byte size) vs
    rejected (reason `"too-large"` | `"unsupported-type"` + user-facing message).
  - An input upload/clear request contract the Input panel will use (e.g.
    `InputRequest` types or a small interface), kept minimal. Epic 04 owns the
    shared icon controls and complete state reset; this task only exposes the
    request surface, it does not implement the reset.
- Do NOT add to or change `src/domain/**` (shared contracts).

## Dependency Boundaries
- `src/lib/` contains small general helpers; it may not import React, the
  worker, or feature components.
- Pure size logic must have no side effects. File reading is the only browser
  boundary and must be isolated and substitutable.
- No network calls of any kind (privacy: user content must never leave the
  browser).

## File Ownership
- Create: `src/lib/size.ts`
- Create: `src/lib/files.ts`
- Create: `tests/lib/size.test.ts`
- Create: `tests/lib/files.test.ts`

## Do Not Change
- `src/domain/**`, `src/engine/**`, `src/worker/**`, `src/hooks/**`
- Existing tests
- Report files (Orchestrator-owned)

## Required Behavior
- `src/lib/size.ts`:
  - Export `MAX_INPUT_BYTES = 10 * 1024 * 1024` as a named constant.
  - Measure encoded UTF-8 byte size of a string (e.g. via `TextEncoder`), not
    `.length`.
  - Provide a predicate for whether text is within / exceeds the limit.
  - Provide the user-facing 10 MB limit explanation message(s) as named
    constants (clear, plain language, per PRD 6.2).
- `src/lib/files.ts`:
  - `readJsonFile(file)` rejects files whose `file.size` exceeds
    `MAX_INPUT_BYTES` BEFORE reading any content, returning a `too-large`
    rejection with the limit message.
  - Accept `.json` files; reject other types with an `unsupported-type`
    rejection and a clear message.
  - Read accepted file text locally only (no network) and also re-check the
    encoded text size against the limit.
  - Return the discriminated `FileReadResult`.
  - Keep the file-reading boundary substitutable for tests (inject or accept a
    `File`/`Blob`-like input).
- Reject pasted/typed input as soon as encoded size exceeds 10 MB while keeping
  the last accepted revision (provide the size check the Input panel uses; the
  panel wiring itself is Task 03.4/Epic 04 — expose the function here).
- No code in user content is executed; content is treated as text only.

## Required Tests
- `tests/lib/size.test.ts`: encoded byte size differs from `.length` for
  multi-byte input; boundary at exactly `MAX_INPUT_BYTES` and one byte over;
  within-limit and over-limit predicates; limit message present and mentions
  10 MB.
- `tests/lib/files.test.ts`: oversize `file.size` is rejected WITHOUT reading
  content (assert read is not attempted, e.g. via a spy/fake); `.json` accepted
  and returns text + byte size; non-`.json` rejected with `unsupported-type`;
  an accepted file whose decoded text exceeds the limit is rejected; no network
  is used.

## Verification Commands
```bash
npm test -- --run tests/lib/size.test.ts tests/lib/files.test.ts
npm run typecheck
npm run architecture
npm run lint
npm run format:check
```

## Handoff Requirements
- Changed files with one-line reasons
- Each verification command and PASS/FAIL result (paste failing output if any)
- Confirmation no domain/worker-protocol contract was changed
- Confirmation no network call is made and user content never leaves the browser
- Known limitations and open questions
- `Agent Routing Used` and `Execution Usage` blocks per
  `doc/agent-workflow.md` section 6 (report `Unavailable` for usage with the
  subscription-runner reason; do not guess)
