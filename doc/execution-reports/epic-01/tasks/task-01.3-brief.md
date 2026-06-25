# Task Brief: Establish Shared Domain Contracts

## Source Epic

- `doc/implementation.md`: Epic 01 Foundation and Contracts
- `doc/implementation/epic-01-foundation-and-contracts.md`

## Source Task

- Task 01.3 Establish Shared Domain Contracts

## Required Workflow

- Repair-Sensitive Task

## Workflow Reason

- This task defines repair-related domain contracts and the worker protocol used by later repair, validation, formatting, conversion, and schema work.
- Repair Safety review is required because repair eligibility, candidates, verification, and analysis outcomes are shared safety contracts.
- Code review is required because this is shared contract and architecture work.

## Required Specialist Reviewers

- Repair Safety Reviewer
- Code Reviewer

## Agent Routing

- Provider: OpenAI
- Role: Shared Contract or Architecture Worker
- Capability tier: Tier A
- Reasoning level: High
- Exact model for this run: GPT-5 Codex session model
- Billing type: Subscription/API-equivalent unavailable
- Processing tier: Not exposed
- Routing reason: Shared repair and worker protocol contracts are mandatory Tier A work.
- Allowed tools: Read repository files, edit owned files, run focused tests, typecheck, lint, inspect diffs.
- Required context: `AGENTS.md`, `doc/brd.md`, `doc/prd.md`, `doc/implementation.md`, `doc/implementation/epic-01-foundation-and-contracts.md`, `doc/agent-workflow.md`, `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review finding.
- Escalation trigger: Contract ambiguity affects later epics, repair eligibility cannot be modeled without exposing candidates, or worker protocol variants conflict with original-input protection.
- Fallback: Same-tier or higher-tier model only.

## Execution Reporting

- Task report: `doc/execution-reports/epic-01/tasks/task-01.3.md`
- Epic report: `doc/execution-reports/epic-01/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 90k-150k
- Implementation-plan retry reserve: Up to 40k
- Refined estimated usage: Estimated 90k-150k agent tokens
- Refined estimated usage cost: Unavailable because exact runner billing dimensions are not exposed
- Rough API-equivalent planning cost: Estimated USD $0.90-$1.50 before retry reserve, using Tier A shared-contract Worker, Repair Safety Reviewer, Code Reviewer, and Orchestrator routing with an 80% input / 20% output / 0% cached-input assumption
- Refinement basis: Cross-epic shared contracts, repair safety review, code review, focused contract tests, lint, and typecheck
- Plan variance: Within plan. `tests/domain/contracts.test.ts` and `eslint.config.js` are added to file ownership to prove contract shape and align lint rules with the documented interface/type policy.
- Retry reserve: Up to 40k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Define serializable shared domain contracts for diagnostics, repair analysis, result documents, and revision-based worker protocol messages.

## Required Reading

- `AGENTS.md`
- `doc/brd.md` repair and original-input rules
- `doc/prd.md` sections 4, 5, 6, and repair/result/schema requirements
- `doc/implementation.md`
- `doc/implementation/epic-01-foundation-and-contracts.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`

## Dependencies

- Task 01.1 Create the Static Client Toolchain accepted.
- Task 01.2 Prove the Minimal Application Shell accepted.

## Required Contracts and Interfaces

- `Diagnostic` with source position, reliability, and repair state.
- `SyntaxEdit`, `RepairCandidate`, verification result, and `safe | ambiguous | manual` repair analysis outcomes.
- Repair eligibility metadata that reports whether a supported repair rule may apply without exposing candidates.
- `ResultDocument` formats and source actions.
- Revision-based worker request and response discriminated unions for source document, formatting, repair, conversion, and schema actions.
- Ephemeral result-validation request that never replaces the protected source-document revision.

## Dependency Boundaries

- `src/domain/` must not import React, DOM, CodeMirror, worker implementation, components, hooks, or state.
- Contracts must be serializable.
- Expected validation, repair, and ambiguity outcomes must be explicit result types, not exceptions.

## File Ownership

- Create: `src/domain/diagnostics.ts`
- Create: `src/domain/repair.ts`
- Create: `src/domain/result.ts`
- Create: `src/domain/workerProtocol.ts`
- Create: `tests/domain/contracts.test.ts`
- Modify: `eslint.config.js`

## Do Not Change

- `src/engine/`
- `src/worker/`
- Product UI behavior
- Repair implementation behavior
- Existing approved prototype or product docs

## Required Behavior

- Use interfaces for stable object-shaped public contracts and boundary APIs.
- Use types for discriminated unions and composed aliases.
- Use readonly fields where mutation is not intended.
- Keep repair eligibility separate from generated repair candidates.
- Ensure automatic eligibility cannot represent a generated candidate.
- Model manual guidance, safe repair, and ambiguous repair as explicit outcomes.
- Keep original source revision separate from result-validation requests.

## Required Tests

- Add focused contract tests proving the exported contract shapes can model diagnostics, repair eligibility, safe/ambiguous/manual analysis, result documents, and worker request/response variants.

## Verification Commands

```bash
npm test -- --run tests/domain/contracts.test.ts
npm run lint
npm run typecheck
```

## Handoff Requirements

- Changed files
- Red and green contract-test evidence
- Verification commands and results
- Known limitations
- Repair Safety and Code Reviewer attention areas
