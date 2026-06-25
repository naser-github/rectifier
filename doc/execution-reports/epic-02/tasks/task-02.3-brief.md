# Task Brief: 02.3 Implement Explicit Syntax Repair Rules

## Assignment

- Epic: 02 Strict Repair Engine
- Task: 02.3 Implement Explicit Syntax Repair Rules
- Workflow: Repair-Sensitive Task
- Required reviewers: Code Reviewer, Repair Safety Reviewer
- Project Orchestrator report: `doc/execution-reports/epic-02/epic-report.md`
- Task execution report: `doc/execution-reports/epic-02/tasks/task-02.3.md`
- Pricing registry: `doc/execution-reports/pricing.yml`

## Budget

- Implementation-plan agent tokens: 155k-260k
- Planning retry reserve: Up to 85k
- Planning confidence: Low
- Refined estimate: Estimated 155k-260k tokens
- Execution retry reserve: Estimated up to 85k tokens
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
- Create `src/engine/repair/rules.ts`
- Modify `doc/implementation/epic-02-strict-repair-engine.md`
- Modify this task report and the epic report

## Requirements

- Rules return only explicit `SyntaxEdit[]`.
- Implement and test missing comma, trailing comma removal, clear missing colon,
  deterministic missing closing delimiter, and safe single-quote delimiter
  replacement.
- Keep unsupported and uncertain patterns out of automatic repair.
- Do not apply edits, verify candidates, or classify complete analysis results
  in this task.

## Verification

```bash
npm test -- --run tests/engine/repair.test.ts
npm run typecheck
npm run architecture
```
