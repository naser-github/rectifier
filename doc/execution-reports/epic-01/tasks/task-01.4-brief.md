# Task Brief: Enforce Architecture Boundaries

## Source Epic

- `doc/implementation.md`: Epic 01 Foundation and Contracts
- `doc/implementation/epic-01-foundation-and-contracts.md`

## Source Task

- Task 01.4 Enforce Architecture Boundaries

## Required Workflow

- Normal Task

## Workflow Reason

- This task enforces source boundaries, circular import rules, and worker-protocol type coverage.
- Code review is required for architecture rules and type-level coverage.

## Required Specialist Reviewers

- Code Reviewer

## Agent Routing

- Provider: OpenAI
- Role: Shared Contract or Architecture Worker
- Capability tier: Tier A
- Reasoning level: High
- Exact model for this run: GPT-5 Codex session model
- Billing type: Subscription/API-equivalent unavailable
- Processing tier: Not exposed
- Routing reason: Cross-epic architecture boundaries and worker protocol coverage are mandatory Tier A work.
- Allowed tools: Read repository files, edit owned files, run focused tests, architecture check, typecheck, lint, build, inspect diffs.
- Required context: `AGENTS.md`, `doc/implementation.md`, `doc/implementation/epic-01-foundation-and-contracts.md`, `doc/agent-workflow.md`, `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this task brief, accepted Task 01.3 contracts.
- Retry limit: One Worker retry for failed implementation or unresolved review finding.
- Escalation trigger: A required boundary conflicts with current source structure or later-epic planned dependencies.
- Fallback: Same-tier or higher-tier model only.

## Execution Reporting

- Task report: `doc/execution-reports/epic-01/tasks/task-01.4.md`
- Epic report: `doc/execution-reports/epic-01/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 60k-100k
- Implementation-plan retry reserve: Up to 25k
- Refined estimated usage: Estimated 60k-100k agent tokens
- Refined estimated usage cost: Unavailable because exact runner billing dimensions are not exposed
- Rough API-equivalent planning cost: Estimated USD $0.60-$1.00 before retry reserve, using Tier A architecture Worker, Code Reviewer, and Orchestrator routing with an 80% input / 20% output / 0% cached-input assumption
- Refinement basis: Dependency-cruiser rule hardening, architecture tests, worker protocol variant type coverage, and Code Reviewer pass
- Plan variance: Within plan
- Retry reserve: Up to 25k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Enforce import boundaries and type-level worker protocol coverage needed by later epics.

## Required Reading

- `AGENTS.md`
- `doc/implementation.md`
- `doc/implementation/epic-01-foundation-and-contracts.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- Accepted Task 01.3 domain contracts

## Dependencies

- Task 01.3 Establish Shared Domain Contracts accepted.

## Required Contracts and Interfaces

- Worker request and response discriminated unions from `src/domain/workerProtocol.ts`.

## Dependency Boundaries

- `src/engine/` may depend only on `src/domain/` and `src/lib/`.
- `src/domain/` must not depend on React, browser APIs, workers, components, or feature implementations.
- Circular imports are forbidden.
- Broad barrel `index.ts` files are forbidden unless explicitly approved in a later task.
- Architecture checks must not use an allowlist to bypass violations.

## File Ownership

- Create: `tests/architecture/importBoundaries.test.ts`
- Modify: `.dependency-cruiser.mjs`

## Do Not Change

- Product behavior
- Repair behavior
- UI behavior
- Shared domain contracts except test-only imports

## Required Behavior

- Add import-boundary tests proving `src/engine/` cannot depend on React, DOM/browser adapter modules, CodeMirror, or worker adapter files.
- Add architecture checks for inward dependency direction, circular imports, cross-feature private imports where applicable, and unapproved broad barrel files using dependency-cruiser rules.
- Add type-level coverage for every worker request and response variant.
- Verify expected domain outcomes use explicit result types instead of exceptions.

## Required Tests

- `tests/architecture/importBoundaries.test.ts` verifies dependency-cruiser rule coverage and worker protocol variant coverage.

## Verification Commands

```bash
npm test -- --run tests/architecture/importBoundaries.test.ts
npm run architecture
npm run typecheck
npm run lint
```

## Handoff Requirements

- Changed files
- Red and green architecture-test evidence
- Verification commands and results
- Known limitations
- Code Reviewer attention areas
