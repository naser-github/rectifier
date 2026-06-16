# Rectifier Agent Model Routing Policy

## 1. Purpose

This document defines which model capability, reasoning level, context, and
tools each Rectifier agent role should receive.

It does not permanently require exact commercial model names. Model names,
availability, prices, and limits change. The Project Orchestrator maps the
capability tiers in this document to the best currently available models before
execution begins.

Model routing changes execution cost and speed. It must never weaken required
reviews, tests, repair safety, or acceptance gates.

## 2. Capability Tiers

### Tier A: Frontier

Use the strongest available coding and reasoning model.

Required for work where a subtle mistake can change user data, break shared
architecture, or approve an unsafe release.

Expected abilities:

- Understand large cross-document and cross-module context.
- Reason carefully about ambiguous requirements.
- Review complex TypeScript and browser-worker behavior.
- Detect unsafe repair behavior and weak tests.
- Make and defend architecture decisions.

### Tier B: Strong

Use a strong coding model that can implement and review focused product work.

Expected abilities:

- Follow exact task briefs and established contracts.
- Implement React, TypeScript, worker, and testing tasks.
- Review focused changes for correctness and maintainability.
- Work within assigned file ownership.

### Tier C: Fast

Use a fast, lower-cost model only for narrow and low-risk work.

Allowed work:

- Simple documentation updates.
- Mechanical changes with exact instructions.
- Small isolated test fixtures.
- Read-only checks with clear expected output.

Tier C must not own repair logic, shared contracts, architecture changes,
release approval, or complex debugging.

## 3. Reasoning Levels

| Level | Use |
| --- | --- |
| XHigh | Exceptional unresolved repair-safety, architecture, or release conflict |
| High | Repair safety, architecture, orchestration, release, complex debugging |
| Medium | Normal implementation, UI work, focused reviews |
| Low | Mechanical documentation and simple isolated tasks |

Increase reasoning to High when:

- Requirements conflict.
- A shared contract must change.
- Repair behavior or original-input protection is involved.
- A failure crosses UI, worker, and engine boundaries.
- The task has failed twice.
- A reviewer and Worker disagree about correctness.

Increase from High to XHigh only when:

- A Tier A High-reasoning attempt failed to resolve a repair-safety,
  architecture, or release blocker.
- Two specialist reviewers disagree on a blocking finding.
- The Orchestrator records why High reasoning was insufficient.

## 4. Default Role Routing

| Agent Role | Default Tier | Reasoning | Tool Access | Context Requirement |
| --- | --- | --- | --- | --- |
| Project Orchestrator | Tier A | High | Read, edit docs, tests, git, agent dispatch | Full BRD, PRD, roadmap, assigned epic, workflow, and relevant handoffs |
| Task Worker: strict repair engine | Tier A | High | Read, edit owned files, focused tests, typecheck | Full repair rules, contracts, fixtures, assigned task |
| Task Worker: shared contracts or architecture | Tier A | High | Read, edit owned files, focused tests, typecheck, build | Relevant architecture, affected epics, shared-contract rules |
| Task Worker: normal implementation | Tier B | Medium | Read, edit owned files, focused tests, typecheck | Assigned task, contracts, relevant requirements |
| Task Worker: UI feature | Tier B | Medium | Read, edit owned files, component tests, browser preview when available | PRD UI sections, prototype, shared UI rules |
| Task Worker: documentation or mechanical change | Tier C | Low | Read and assigned-file edits | Exact source documents and expected output |
| Code Reviewer | Tier A | High | Read-only, diff inspection, test and build evidence | Changed code, architecture rules, task brief, handoff |
| Repair Safety Reviewer | Tier A | High | Read-only, repair tests and fixture evidence | Full repair rules, exact-source policy, candidate verification |
| UI Reviewer | Tier B | Medium | Read-only, component/browser evidence | Prototype, PRD UI rules, accessibility requirements |
| Release Reviewer | Tier A | High | Read-only, full verification and traceability evidence | All accepted epics, traceability, performance, run guide |

## 5. Current Recommended Model Profile

This profile records the current preferred mapping as of June 11, 2026. Review
it before starting implementation because available model names may change.

| Capability Tier | Current Preferred Model | Default Reasoning |
| --- | --- | --- |
| Tier A: Frontier | `gpt-5.5` | High |
| Tier B: Strong | `gpt-5.4` | Medium |
| Tier C: Fast | `gpt-5.4-mini` | Low or Medium |

Current role assignments:

| Agent Role | Current Model | Reasoning |
| --- | --- | --- |
| Project Orchestrator | `gpt-5.5` | High |
| Strict Repair Engine Worker | `gpt-5.5` | High |
| Shared Contract or Architecture Worker | `gpt-5.5` | High |
| Normal Task Worker | `gpt-5.4` | Medium |
| UI Feature Worker | `gpt-5.4` | Medium |
| Documentation or Mechanical Worker | `gpt-5.4-mini` | Low |
| Code Reviewer | `gpt-5.5` | High |
| Repair Safety Reviewer | `gpt-5.5` | High |
| UI Reviewer | `gpt-5.4` | Medium |
| Release Reviewer | `gpt-5.5` | High |

The Project Orchestrator owns requirements checks, small-task checks, and
documentation checks.

## 6. Model Assignment Rules

Before assigning a Worker or Reviewer, the Project Orchestrator records:

- Provider.
- Agent role.
- Capability tier.
- Reasoning level.
- Billing type.
- Processing tier when the provider uses one.
- Why the selected tier is sufficient.
- Required context documents.
- Allowed tools.
- Retry count.
- Escalation trigger.

Use a higher tier when uncertain. Never use a lower tier because the preferred
model is busy if that would violate this policy.

The provider and exact model name must be recorded in every task brief and every
actual execution record for that run. Capability tiers remain the durable
policy.

## 7. Mandatory Tier A Work

Tier A with High reasoning is mandatory for:

- Project Orchestrator decisions that affect multiple epics.
- Strict repair engine rules.
- Repair eligibility classification.
- Candidate fingerprint and exact-source verification.
- Repair Safety review.
- Shared worker protocol or workspace contract changes.
- Cross-epic architecture changes.
- Complex debugging after two failed attempts.
- Final Code review for repair-sensitive or architecture work.
- Release review and final release acceptance.

Do not downgrade these tasks.

## 8. Tier C Restrictions

Tier C agents must not:

- Change product behavior.
- Change repair behavior or repair eligibility.
- Change files under `src/domain/` or `src/engine/repair/`.
- Change the worker protocol or workspace reducer contract.
- Approve code, repair safety, UI acceptance, or release.
- Resolve requirement conflicts.
- Perform final verification.
- Edit files outside the exact task brief.

If a Tier C task becomes unclear or affects behavior, stop and escalate it.

## 9. Context Policy

Give each agent the smallest complete context needed to do the work correctly.
Do not provide the entire repository without a reason.

Every agent receives:

- `AGENTS.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`
- The task brief
- The assigned epic task

Add these when relevant:

- BRD and PRD sections for Worker and specialist Reviewer roles.
- Approved prototype for UI work.
- Repair engine rules and fixtures for repair work.
- Shared-contract definitions for integration work.
- Previous Worker handoff and reviewer findings for rework.
- Traceability, performance, and run-guide evidence for release work.

If required context does not fit, do not silently drop documents. Split the
task, summarize accepted contracts, or use a larger-context Tier A model.

Context budget rules:

- Do not use a fixed token number because model context limits may change.
- Keep the initial task brief and supplied documents below roughly 60% of the
  available context.
- Reserve the remaining context for repository inspection, implementation,
  test output, reviewer findings, and rework.
- When the relevant context cannot fit safely, split the task before assigning
  a Worker.

## 10. Tool Access Policy

Workers may:

- Read repository files.
- Edit only assigned files.
- Run focused tests and required verification.
- Inspect diffs.

Reviewers should remain read-only unless the Project Orchestrator creates a
separate fix task.

Reviewer independence rules:

- A Worker must not approve its own work.
- Use a fresh reviewer agent instance with a review-only task brief.
- For Repair Safety and Release review, prefer a fresh context that contains
  requirements, changed files, tests, and handoff evidence rather than the
  Worker's implementation conversation.
- The same exact model may be used when required by the routing tier, but the
  reviewer must still be a separate agent instance.

Network access is disabled by default. The Project Orchestrator may approve it
only for a documented dependency, official documentation, or release need.

Only the Project Orchestrator may:

- Assign or change file ownership.
- Approve shared-contract changes.
- Change task workflow or model routing.
- Accept tasks and epics.
- Approve retry escalation.

No agent may use network services that send user JSON outside the browser
product or introduce an AI dependency into Rectifier.

## 11. Retry and Escalation Policy

Maximum retries for the same Worker at the same tier:

- One retry for a failed implementation or unresolved review finding.
- After the second failure, stop and escalate.

Escalation order:

1. Increase reasoning level.
2. Move the task to a higher capability tier.
3. Reduce task scope or split the task.
4. Ask the Project Orchestrator to resolve requirement or contract ambiguity.

Immediately escalate without retry when:

- Repair safety cannot be proven.
- Requirements conflict.
- A shared contract change affects active parallel work.
- A Worker needs files outside assigned ownership.
- Tests reveal original-input mutation or changed user data.
- Release verification fails.

## 12. Fallback Policy

When the preferred model is unavailable:

- Use another model from the same capability tier.
- Use a higher tier when the same tier is unavailable.
- Wait or stop when only a lower tier is available for mandatory Tier A work.
- Record the fallback and reason in the task brief.

Never silently downgrade a mandatory Tier A role.

## 13. Cost, Usage, and Speed Policy

- Prefer Tier C for safe, mechanical documentation work.
- Prefer Tier B for focused normal implementation and UI tasks.
- Use Tier A only where its stronger reasoning reduces meaningful project risk.
- Do not split one small task among multiple agents without a clear review or
  speed benefit.
- Do not run duplicate agents on the same task unless the Orchestrator requests
  an independent review.

Safety, correctness, and required reviews take priority over cost.

The Project Orchestrator must use the provider-neutral reporting rules and
templates in `doc/execution-reports/README.md`.

Before a task starts:

- Copy the task's implementation-plan agent-token estimate and planning retry
  reserve from the assigned epic plan.
- Record each planned role, provider, exact model, billing type, estimated
  usage cost, estimate basis, processing tier, and retry reserve.
- Use a current pricing entry from `doc/execution-reports/pricing.yml` when a
  provider exposes public or contracted rates.
- If the routing-specific refined estimate exceeds the implementation-plan
  upper bound, update the epic plan and record the reason before execution.

After every execution:

- Record the actual provider, exact model, reported usage dimensions, pricing
  entry, calculation result, and execution result.
- Record a routing-change reason when actual routing differs from planned
  routing.
- Use only runner, provider response, dashboard, or invoice evidence for actual
  usage and billed cost.
- Never guess actual usage or cost. Use `Unavailable` with a reason when exact
  evidence is missing.

Different providers may charge for input, output, cache reads, cache writes,
reasoning, requests, tools, images, time, or other dimensions. Calculate only
the dimensions charged by that provider. Do not apply an OpenAI-specific
formula to another provider.

Keep these values separate:

- Estimated usage cost.
- Calculated usage cost.
- API-equivalent cost for subscription or non-API execution.
- Billed cost proven by billing evidence.

Local execution may have zero API cost while infrastructure cost remains
`Unavailable`. Subscription execution may have billed cost marked
`Included in subscription` while API-equivalent cost is recorded separately.

## 14. Task Brief Model Routing Template

```markdown
## Agent Routing
- Provider: [Provider name]
- Role: [Agent role]
- Capability tier: [Tier A, Tier B, or Tier C]
- Reasoning level: [XHigh, High, Medium, or Low]
- Exact model for this run: [Required current model name]
- Billing type: [API, subscription, local, or other]
- Processing tier: [Provider-specific tier or "Not applicable"]
- Routing reason: [Why this tier is sufficient]
- Allowed tools: [Tools]
- Required context: [Documents and contracts]
- Retry limit: [Number]
- Escalation trigger: [Concrete trigger]
- Fallback: [Same-tier or higher-tier model]
- Implementation-plan agent tokens: [Range from assigned epic plan]
- Implementation-plan retry reserve: [Amount from assigned epic plan]
- Refined estimated usage: [Provider-specific dimensions or token range]
- Estimated usage cost: [Amount and currency, or `Unavailable` with reason]
- Estimate basis: [Comparable task, routing, planned usage, and pricing
  assumptions]
- Plan variance: [Within plan, or reason the epic plan was updated]
- Retry reserve: [Amount or percentage]
```

## 15. Routing Acceptance Checklist

- [ ] Every task brief records agent routing.
- [ ] Every task brief records the provider, billing type, and processing tier.
- [ ] Every task brief records the exact model used for that run.
- [ ] Every actual execution records its provider and exact model.
- [ ] Every task brief preserves its implementation-plan estimate.
- [ ] Estimated usage cost and retry reserve are recorded before execution.
- [ ] Any refined estimate above the planned upper bound updates the epic plan
      and records a reason before execution.
- [ ] Actual usage and cost are evidence-based or marked `Unavailable` with a
      reason.
- [ ] Mandatory Tier A work is not downgraded.
- [ ] Every agent receives the required context.
- [ ] Reviewer agents remain read-only.
- [ ] Retry and escalation rules are followed.
- [ ] Model routing never weakens workflow or specialist reviewer requirements.
