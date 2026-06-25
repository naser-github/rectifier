# Task Brief: 02.4 Generate, Verify, and Classify Candidates

## Assignment

- Epic: 02 Strict Repair Engine
- Task: 02.4 Generate, Verify, and Classify Candidates
- Workflow: Repair-Sensitive Task
- Required reviewers: Code Reviewer, Repair Safety Reviewer
- Project Orchestrator report: `doc/execution-reports/epic-02/epic-report.md`
- Task execution report: `doc/execution-reports/epic-02/tasks/task-02.4.md`
- Pricing registry: `doc/execution-reports/pricing.yml`

## Budget

- Implementation-plan agent tokens: 145k-240k
- Planning retry reserve: Up to 80k
- Planning confidence: Low
- Refined estimate: Estimated 145k-240k tokens
- Execution retry reserve: Estimated up to 80k tokens
- Estimated usage cost: Unavailable; runner does not expose exact usage or subscription allocation

## Agent Routing

| Role | Provider | Exact Model | Capability Tier | Reasoning | Billing Type | Processing Tier |
| --- | --- | --- | --- | --- | --- | --- |
| Project Orchestrator | OpenAI | GPT-5 Codex session model | Tier A | High | Subscription | Unavailable |
| Strict Repair Engine Worker | OpenAI | GPT-5 Codex session model | Tier A | High | Subscription | Unavailable |
| Code Reviewer | OpenAI | GPT-5 Codex session model | Tier A | High | Subscription | Unavailable |
| Repair Safety Reviewer | OpenAI | GPT-5 Codex session model | Tier A | High | Subscription | Unavailable |

## Owned Files

- Modify `tests/engine/repair.test.ts`
- Create `src/engine/repair/applyCandidate.ts`
- Create `src/engine/repair/verifyCandidate.ts`
- Create `src/engine/repair/candidates.ts`
- Create `src/engine/repair/analyzeJson.ts`
- Modify `doc/implementation/epic-02-strict-repair-engine.md`
- Modify this task report and the epic report

## Requirements

- Apply edits without mutating the original input.
- Reject edits that overlap protected key or value content.
- Parse every candidate as complete strict JSON.
- Compare complete semantic and exact-source data-token fingerprints.
- Return one verified deterministic candidate as `safe`.
- Return multiple verified candidates as `ambiguous`.
- Return `manual` when no candidate can be proven safe.

## Verification

```bash
npm test -- --run tests/engine/repair.test.ts
npm run typecheck
npm run architecture
```
