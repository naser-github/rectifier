# Task Brief: Implement Tolerant Tokenization and Fingerprints

## Source Epic

- `doc/implementation.md`: Epic 02 Strict Repair Engine
- `doc/implementation/epic-02-strict-repair-engine.md`

## Source Task

- Task 02.2 Implement Tolerant Tokenization and Fingerprints

## Required Workflow

- Repair-Sensitive Task

## Workflow Reason

- This task creates safety-critical tokenizer and fingerprint logic used to
  prove repairs preserve user data.
- Repair Safety review and Code review are required.

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
- Routing reason: Tokenization and data fingerprints are mandatory Tier A work.
- Allowed tools: Read repository files, edit owned files, run focused tests,
  typecheck, architecture check, inspect diffs.
- Required context: `AGENTS.md`, BRD repair rules, PRD repair principles,
  Epic 02 plan, accepted Task 02.1 fixtures, accepted Epic 01 repair contracts,
  and this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review
  finding.
- Escalation trigger: Tokenization cannot distinguish protected data content
  from syntax delimiters, or fingerprint comparison cannot detect exact-source
  changes.
- Fallback: Same-tier or higher-tier model only.

## Execution Reporting

- Task report: `doc/execution-reports/epic-02/tasks/task-02.2.md`
- Epic report: `doc/execution-reports/epic-02/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 130k-215k
- Implementation-plan retry reserve: Up to 70k
- Refined estimated usage: Estimated 130k-215k agent tokens
- Refined estimated usage cost: Unavailable because exact runner billing
  dimensions are not exposed
- Rough API-equivalent planning cost: Estimated USD $1.30-$2.15 before retry
  reserve, using Tier A Worker, Repair Safety Reviewer, Code Reviewer, and
  Orchestrator routing with an 80% input / 20% output / 0% cached-input
  assumption
- Refinement basis: Safety-critical tokenizer logic, fingerprints, mutation
  checks, focused tests, repair safety review, and code review
- Plan variance: Within plan
- Retry reserve: Up to 70k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Implement tolerant tokenization and data-token fingerprints that preserve both
semantic value and exact protected source content.

## Required Reading

- `AGENTS.md`
- `doc/brd.md` sections 7.6 and 9
- `doc/prd.md` sections 4.1-4.4
- `doc/implementation/epic-02-strict-repair-engine.md`
- `tests/fixtures/repair-cases.ts`
- `src/domain/repair.ts`

## Dependencies

- Task 02.1 Build the Repair Safety Fixture Matrix accepted.

## Required Contracts and Interfaces

- Tokenizer output must distinguish syntax tokens from protected data tokens.
- Fingerprints must include token kind, semantic value, exact source content,
  source range, and source order.

## Dependency Boundaries

- `src/engine/repair/` may depend only on `src/domain/` and pure helpers from
  `src/lib/`.
- Do not import React, DOM, CodeMirror, Web Worker APIs, components, hooks, or
  state.

## File Ownership

- Create: `src/engine/repair/tokenizer.ts`
- Create: `src/engine/repair/fingerprint.ts`
- Modify: `tests/engine/repair.test.ts`

## Do Not Change

- Product UI behavior
- Worker behavior
- Domain contracts unless explicitly approved
- Docker runtime

## Required Behavior

- Write failing tests for token kind, decoded value, exact protected source
  content, protected source range, and source order.
- Tokenize supported invalid syntax without treating syntax delimiters as data.
- Record both semantic value and exact protected source content for string,
  number, boolean, and null data tokens.
- Treat quote delimiters as syntax only when changing them preserves every
  enclosed source character exactly.
- Produce an ordered fingerprint that detects invented, removed, changed,
  reformatted, re-escaped, or reordered data.
- Confirm tokenizer and fingerprint functions do not mutate input.

## Required Tests

- Focused tests in `tests/engine/repair.test.ts`.

## Verification Commands

```bash
npm test -- --run tests/engine/repair.test.ts
npm run typecheck
npm run architecture
```

## Handoff Requirements

- Changed files
- Red and green test evidence
- Verification commands and results
- Known limitations
- Repair Safety and Code Reviewer attention areas
