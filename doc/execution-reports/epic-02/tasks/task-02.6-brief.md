# Task Brief: 02.6 Perform the Repair Safety Audit

## Assignment

- Epic: 02 Strict Repair Engine
- Task: 02.6 Perform the Repair Safety Audit
- Workflow: Repair-Sensitive Task
- Required reviewers: Code Reviewer, Repair Safety Reviewer
- Project Orchestrator report: `doc/execution-reports/epic-02/epic-report.md`
- Task execution report: `doc/execution-reports/epic-02/tasks/task-02.6.md`
- Pricing registry: `doc/execution-reports/pricing.yml`

## Budget

- Implementation-plan agent tokens: 105k-190k
- Planning retry reserve: Up to 70k
- Planning confidence: Low
- Refined estimate: Estimated 105k-190k tokens
- Execution retry reserve: Estimated up to 70k tokens
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
- Modify `doc/implementation/epic-02-strict-repair-engine.md`
- Modify this task report and the epic report

## Requirements

- Run every accepted, ambiguous, and refused fixture.
- Add mutation and forbidden-import tests.
- Add adversarial tests proving semantically equivalent number or string
  rewrites are refused.
- Add regression fixtures for every review finding.
- Obtain explicit Repair Safety Reviewer approval.

## Verification

```bash
npm test -- --run tests/engine/repair.test.ts \
  tests/architecture/importBoundaries.test.ts
npm run typecheck
npm run architecture
```
