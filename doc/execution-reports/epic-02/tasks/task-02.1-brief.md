# Task Brief: Build the Repair Safety Fixture Matrix

## Source Epic

- `doc/implementation.md`: Epic 02 Strict Repair Engine
- `doc/implementation/epic-02-strict-repair-engine.md`

## Source Task

- Task 02.1 Build the Repair Safety Fixture Matrix

## Required Workflow

- Repair-Sensitive Task

## Workflow Reason

- This task defines accepted, ambiguous, refused, and adversarial repair cases
  that control later repair-engine behavior.
- Repair Safety review is required because fixture expectations define what the
  engine may safely repair or must refuse.
- Code review is required because fixture contracts and tests become shared
  safety evidence for later tasks.

## Required Specialist Reviewers

- Repair Safety Reviewer
- Code Reviewer

## Agent Routing

- Provider: OpenAI
- Role: Strict Repair Engine Worker
- Capability tier: Tier A
- Reasoning level: High
- Exact model for this run: GPT-5 Codex session model
- Billing type: Subscription/API-equivalent unavailable
- Processing tier: Not exposed
- Routing reason: Repair safety fixtures are mandatory Tier A work because
  wrong expectations can permit data-changing repairs.
- Allowed tools: Read repository files, edit owned files, run focused tests,
  typecheck, inspect diffs.
- Required context: `AGENTS.md`, BRD sections 7.6 and 9, PRD sections 4.1-4.4
  and 8, `doc/implementation.md`,
  `doc/implementation/epic-02-strict-repair-engine.md`,
  `doc/agent-workflow.md`, `doc/agent-model-routing.md`,
  `doc/execution-reports/README.md`, accepted Epic 01 repair contracts, and
  this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review
  finding.
- Escalation trigger: Any fixture would require guessing user data, changing
  data tokens, or expanding repair scope beyond supported syntax.
- Fallback: Same-tier or higher-tier model only.

## Execution Reporting

- Task report: `doc/execution-reports/epic-02/tasks/task-02.1.md`
- Epic report: `doc/execution-reports/epic-02/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 80k-130k
- Implementation-plan retry reserve: Up to 35k
- Refined estimated usage: Estimated 80k-130k agent tokens
- Refined estimated usage cost: Unavailable because exact runner billing
  dimensions are not exposed
- Rough API-equivalent planning cost: Estimated USD $0.80-$1.30 before retry
  reserve, using Tier A Worker, Repair Safety Reviewer, Code Reviewer, and
  Orchestrator routing with an 80% input / 20% output / 0% cached-input
  assumption
- Refinement basis: Fixture matrix, focused tests, repair safety review, code
  review, and comparable Epic 01 reporting limits
- Plan variance: Within plan. `tests/fixtures/repair-cases.ts` and
  `tests/engine/repair.test.ts` are owned by the task.
- Retry reserve: Up to 35k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Create the repair safety fixture matrix before repair-engine implementation.

## Required Reading

- `AGENTS.md`
- `doc/brd.md` sections 7.6 and 9
- `doc/prd.md` sections 4.1-4.4 and 8
- `doc/implementation.md`
- `doc/implementation/epic-02-strict-repair-engine.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- Accepted Epic 01 domain contracts

## Dependencies

- Epic 01 Foundation Ready accepted.

## Required Contracts and Interfaces

- Use accepted repair terms from `src/domain/repair.ts`: `safe`,
  `ambiguous`, and `manual`.

## Dependency Boundaries

- Fixture files may import shared domain contracts from `src/domain/`.
- Do not import repair engine implementation because it does not exist yet.
- Do not add product UI, worker adapter, schema, conversion, or storage logic.

## File Ownership

- Create: `tests/fixtures/repair-cases.ts`
- Create: `tests/engine/repair.test.ts`

## Do Not Change

- `src/engine/repair/`
- `src/domain/`
- Product UI behavior
- Worker behavior
- Docker runtime

## Required Behavior

- Add safe cases for missing comma, trailing comma, clear missing colon,
  deterministic missing closing delimiter, and safe single-quote delimiter
  replacement.
- Add ambiguous cases where more than one verified structure is possible.
- Add refused cases including `{'jhon'}`, unknown values, adjacent values,
  unterminated strings, invalid escapes, and broken Unicode.
- Add adversarial refused cases where decoded values look equivalent but exact
  data text changes, including `1` to `1.0`, `1e1` to `10`, and `"a"` to
  `"\u0061"`.
- Record the expected classification and reason for every fixture.

## Required Tests

- `tests/engine/repair.test.ts` verifies fixture groups exist and every fixture
  has a classification and reason.

## Verification Commands

```bash
npm test -- --run tests/engine/repair.test.ts
npm run typecheck
```

## Handoff Requirements

- Changed files
- Fixture group summary
- Verification commands and results
- Known limitations
- Repair Safety and Code Reviewer attention areas
