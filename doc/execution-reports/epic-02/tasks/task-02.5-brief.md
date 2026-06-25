# Task Brief: 02.5 Classify Repair Eligibility

## Assignment

- Epic: 02 Strict Repair Engine
- Task: 02.5 Classify Repair Eligibility
- Workflow: Repair-Sensitive Task
- Required reviewers: Code Reviewer, Repair Safety Reviewer
- Project Orchestrator report: `doc/execution-reports/epic-02/epic-report.md`
- Task execution report: `doc/execution-reports/epic-02/tasks/task-02.5.md`
- Pricing registry: `doc/execution-reports/pricing.yml`

## Budget

- Implementation-plan agent tokens: 105k-170k
- Planning retry reserve: Up to 50k
- Planning confidence: Low
- Refined estimate: Estimated 105k-170k tokens
- Execution retry reserve: Estimated up to 50k tokens
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
- Modify `src/engine/repair/analyzeJson.ts`
- Modify `doc/implementation/epic-02-strict-repair-engine.md`
- Modify this task report and the epic report

## Requirements

- Add a pure `classifyRepairEligibility()` API.
- Return only metadata: supported-rule-may-apply or unsupported.
- Do not generate, verify, select, or expose a repair candidate.
- Test supported classifications and false-positive boundaries.
- Confirm full candidate generation and verification happen only after the
  user-triggered repair request.

## Verification

```bash
npm test -- --run tests/engine/repair.test.ts
npm run typecheck
npm run architecture
```
