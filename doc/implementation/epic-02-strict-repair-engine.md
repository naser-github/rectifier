# Epic 02: Strict Repair Engine Execution Plan

> **Required workflow:** Repair-sensitive workflow from
> `doc/agent-workflow.md`, including a Repair Safety Reviewer.

**Goal:** Build and prove a pure repair engine that fixes only supported JSON
syntax and never changes user data or guesses intended meaning.

**Exit milestone:** Repair Safety Approved

## Why This Epic Exists

Repair is the highest-risk product feature. A normal parser can identify broken
JSON, but automatic repair can silently change meaning. Rectifier must prove
that each proposed repair preserves every data token before any UI or worker
integration may trust it.

The product interface must not be completed until this epic is accepted.

## Scope

- Tolerant tokenization for supported invalid JSON.
- Data-token fingerprints.
- Explicit syntax edit rules.
- Candidate generation, application, and verification.
- Repair-eligibility classification that recognizes whether a supported rule
  may apply without generating a candidate.
- Safe, ambiguous, and manual classification.
- Strong accepted and refused repair fixtures.

## Out of Scope

- Web Worker handlers.
- Repair dialogs and action buttons.
- AI, free-text repair instructions, or broad best-effort repair.
- Repairing unsupported invalid strings, escapes, Unicode, or unknown values.

## Dependencies and References

- Requires Foundation Ready.
- Read: BRD sections 7.6 and 9, PRD sections 4.1-4.4 and 8, and the global
  repair safety rules in `doc/implementation.md`.

## Owned Files

```text
src/engine/repair/analyzeJson.ts
src/engine/repair/applyCandidate.ts
src/engine/repair/candidates.ts
src/engine/repair/fingerprint.ts
src/engine/repair/rules.ts
src/engine/repair/tokenizer.ts
src/engine/repair/verifyCandidate.ts
tests/engine/repair.test.ts
tests/fixtures/repair-cases.ts
```

Changes to `src/domain/diagnostics.ts` or `src/domain/repair.ts` require explicit
Project Orchestrator approval.

## Execution Policy

### Entry Gate

- Epic 01 contracts and import-boundary tests pass.
- The Orchestrator assigns exclusive ownership of all repair-engine files.
- The Repair Safety Reviewer agrees on accepted and refused fixture groups
  before implementation begins.

### Safety Policy

- Write refusal tests before repair rules.
- Implement one repair rule at a time.
- Every candidate must become strict valid JSON.
- Original and repaired data-token values, types, exact source content, and
  order must match exactly. Only approved delimiter characters may differ.
- Reject any syntax edit that overlaps protected data-token content.
- Multiple verified meanings must remain ambiguous.
- No verified candidate must return manual guidance.
- Never weaken a refusal test merely to make a repair pass.

### Review Policy

Each repair rule requires Code and Repair Safety review. The Repair Safety
Reviewer checks both positive cases and cases that look similar but must be
refused.

### Completion Policy

Repair Safety Approved requires the entire repair suite, type checking, import
boundaries, mutation checks, and safety review to pass.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
specialist Reviewer executions. The Orchestrator refines usage and cost before
each task starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 02.1 Build the Repair Safety Fixture Matrix | 80k-130k | Up to 35k | Medium | Test-focused work with Code and Repair Safety review |
| 02.2 Implement Tolerant Tokenization and Fingerprints | 130k-215k | Up to 70k | Low | New safety-critical parser logic and adversarial tests |
| 02.3 Implement Explicit Syntax Repair Rules | 155k-260k | Up to 85k | Low | Multiple test-first repair rules and refusal boundaries |
| 02.4 Generate, Verify, and Classify Candidates | 145k-240k | Up to 80k | Low | Safety-critical candidate verification and ambiguity behavior |
| 02.5 Classify Repair Eligibility | 105k-170k | Up to 50k | Low | Strict separation from candidate generation with boundary tests |
| 02.6 Perform the Repair Safety Audit | 105k-190k | Up to 70k | Low | Full adversarial review and likely accepted rework |
| **Epic Total** | **720k-1,205k** | **Up to 390k** | **Low** | **Repair safety requires independent review and has high rework risk** |

## Tasks

### Task 02.1: Build the Repair Safety Fixture Matrix

- [x] Add safe cases for missing comma, trailing comma, clear missing colon,
  deterministic missing closing delimiter, and safe single-quote delimiter
  replacement.
- [x] Add ambiguous cases where more than one verified structure is possible.
- [x] Add refused cases including `{'jhon'}`, unknown values, adjacent values,
  unterminated strings, invalid escapes, and broken Unicode.
- [x] Add adversarial refused cases where decoded values look equivalent but
  exact data text changes, including `1` to `1.0`, `1e1` to `10`, and
  `"a"` to `"\u0061"`.
- [x] Record the expected classification and reason for every fixture.

### Task 02.2: Implement Tolerant Tokenization and Fingerprints

- [x] Write failing tests for token kind, decoded value, exact protected source
  content, protected source range, and source order.
- [x] Tokenize supported invalid syntax without treating syntax delimiters as
  data.
- [x] Record both semantic value and exact protected source content for string,
  number, boolean, and null data tokens.
- [x] Treat quote delimiters as syntax only when changing them preserves every
  enclosed source character exactly.
- [x] Produce an ordered fingerprint that detects invented, removed, changed,
  reformatted, re-escaped, or reordered data.
- [x] Confirm tokenizer and fingerprint functions do not mutate input.

### Task 02.3: Implement Explicit Syntax Repair Rules

- [x] Make each rule return only explicit `SyntaxEdit[]`.
- [x] Implement and test missing comma.
- [x] Implement and test trailing comma removal.
- [x] Implement and test clear missing colon.
- [x] Implement and test deterministic missing closing delimiter.
- [x] Implement and test safe single-quote delimiter replacement with the same
  decoded string value.
- [x] Keep unsupported and uncertain patterns out of automatic repair.

### Task 02.4: Generate, Verify, and Classify Candidates

- [x] Apply edits without mutating the original input.
- [x] Reject any edit that overlaps protected key or value content; allow only
  proven syntax-delimiter range edits.
- [x] Parse the complete candidate as strict JSON.
- [x] Compare complete semantic and exact-source data-token fingerprints.
- [x] Return one verified deterministic candidate as `safe`.
- [x] Return multiple verified candidates as `ambiguous` without selecting one.
- [x] Return `manual` when no candidate can be proven safe.

### Task 02.5: Classify Repair Eligibility

- [x] Add a pure `classifyRepairEligibility()` API that recognizes whether a
  confirmed diagnostic and its local syntax context match a supported repair
  rule.
- [x] Do not generate, verify, select, or expose a repair candidate from
  eligibility classification.
- [x] Return metadata only: supported-rule-may-apply or unsupported.
- [x] Test supported-rule classifications and false-positive boundaries.
- [x] Confirm full candidate generation and verification happen only after the
  user-triggered repair request.

### Task 02.6: Perform the Repair Safety Audit

- [x] Run every accepted, ambiguous, and refused fixture.
- [x] Add mutation and forbidden-import tests.
- [x] Add adversarial tests proving semantically equivalent number or string
  rewrites are refused.
- [x] Add regression fixtures for every review finding.
- [x] Obtain explicit Repair Safety Reviewer approval.

## Verification

```bash
npm test -- --run tests/engine/repair.test.ts \
  tests/architecture/importBoundaries.test.ts
npm run typecheck
```

Expected result: every unsafe or unsupported case is refused, and every
returned candidate preserves the complete data-token fingerprint.

## Acceptance Checklist

- [x] Pure API exposes analyze, generate, verify, and apply operations.
- [x] Original input is never mutated.
- [x] Every returned candidate is strict valid JSON.
- [x] Safe, ambiguous, and manual outcomes are explicit.
- [x] No rule invents, removes, changes, or reorders data.
- [x] Refusal cases include invalid strings, escapes, and Unicode.
- [x] Code and Repair Safety Reviewers approve.

## Handoff to Later Epics

Provide the accepted repair API, classification rules, safety fixture list, and
the exact meaning of each refusal. Epic 03 may only adapt this API; it may not
reimplement repair rules inside the worker.
