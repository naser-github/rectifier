# Epic Execution Report: Epic 04 Core Workspace and Shared UI

## Epic Information

- Status: Accepted
- Report owner: Project Orchestrator
- Started: 2026-06-26
- Completed: 2026-06-26
- Total tasks: 5 (all Accepted)

## Routing Note

This epic continues in the same Anthropic Claude Code subscription session as
Epic 03. The durable capability tiers in `doc/agent-model-routing.md` are
unchanged; Tier A maps to `claude-opus-4-8` and Tier B maps to
`claude-sonnet-4-6` for this session. No mandatory Tier A work is downgraded.

## Epic Budget

| Task | Implementation-Plan Agent Tokens | Planning Retry Reserve | Refined Estimated Usage Cost | Execution Retry Reserve | Estimated Budget |
| --- | ---: | ---: | ---: | ---: | ---: |
| 04.1 Define the Workspace State Machine | 110k-190k | Up to 50k | Unavailable: subscription runner billing dimensions are not exposed | Up to 50k estimated agent tokens | Unavailable |
| 04.2 Build Shared Interface Primitives | 90k-155k | Up to 45k | Unavailable: subscription runner billing dimensions are not exposed | Up to 45k estimated agent tokens | Unavailable |
| 04.3 Implement Disabled Reasons | 70k-120k | Up to 35k | Unavailable: subscription runner billing dimensions are not exposed | Up to 35k estimated agent tokens | Unavailable |
| 04.4 Implement First-Visit Sample and Persistence | 85k-140k | Up to 40k | Unavailable: subscription runner billing dimensions are not exposed | Up to 40k estimated agent tokens | Unavailable |
| 04.5 Perform Base Integration | 90k-155k | Up to 50k | Unavailable: subscription runner billing dimensions are not exposed | Up to 50k estimated agent tokens | Unavailable |
| **Epic Total** | **445k-760k** | **Up to 220k** | **Unavailable** | **Up to 220k estimated agent tokens** | **Unavailable** |

## Task Results

| Task | Providers and Models Used | Estimated Budget | Calculated Usage Cost | API-Equivalent Cost | Billed Cost | Difference |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 04.1 Define the Workspace State Machine | Anthropic claude-opus-4-8 (Orchestrator, Code, Repair Safety) + claude-sonnet-4-6 (Worker) | Unavailable | Unavailable | Unavailable | Included in subscription | Unavailable |
| 04.2 Build Shared Interface Primitives | Anthropic claude-opus-4-8 (Orchestrator, Code) + claude-sonnet-4-6 (Worker) | Unavailable | Unavailable | Unavailable | Included in subscription | Unavailable |
| 04.3 Implement Disabled Reasons | Anthropic claude-opus-4-8 (Orchestrator, Code, Repair Safety) + claude-sonnet-4-6 (Worker) | Unavailable | Unavailable | Unavailable | Included in subscription | Unavailable |
| 04.4 Implement First-Visit Sample and Persistence | Anthropic claude-opus-4-8 (Orchestrator, Code) + claude-sonnet-4-6 (Worker) | Unavailable | Unavailable | Unavailable | Included in subscription | Unavailable |
| 04.5 Perform Base Integration | Anthropic claude-opus-4-8 (Orchestrator, Code) + claude-sonnet-4-6 (Worker) | Unavailable | Unavailable | Unavailable | Included in subscription | Unavailable |
| **Epic Total** | | **Unavailable** | **Unavailable** | **Unavailable** | **Included in subscription** | **Unavailable** |

## Provider and Model Totals

| Provider | Exact Model | Billing Type | Processing Tier | Executions | Calculated Usage Cost | API-Equivalent Cost | Billed Cost |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| Anthropic | claude-opus-4-8 | Subscription | Not exposed | ~15 (Tasks 04.1-04.5) | Unavailable | Unavailable | Included in subscription |
| Anthropic | claude-sonnet-4-6 | Subscription | Not exposed | ~12 (Tasks 04.1-04.5) | Unavailable | Unavailable | Included in subscription |

## Shared Epic Overhead

| Execution ID | Role | Provider | Exact Model | Usage Source | Cost Type | Cost |
| --- | --- | --- | --- | --- | --- | ---: |
| None recorded | | | | | | |

## Cost Summary

- Currency: USD
- Estimated epic budget: Unavailable: subscription runner billing dimensions are not exposed
- Calculated usage cost: Unavailable: subscription runner does not expose per-run token usage
- API-equivalent cost: Unavailable: per-run token usage not exposed
- Billed cost: Included in subscription
- Difference from estimated budget: Unavailable
- Budget status: In Progress
- Shared epic overhead: Unavailable

## Missing Evidence

- Per-run token usage and cost are not exposed by the Claude Code subscription
  runner. All actual usage and cost fields are recorded as `Unavailable` with
  this reason.

## Epic Result

- ACCEPTED. Exit milestone "Core Workspace Ready" reached. All 5 tasks
  accepted with required reviews (Code, UI, Repair Safety). Full suite 262
  tests across 24 files; typecheck, lint, format, and architecture all green.
  One reducer owns workspace transitions; stale responses are guarded by
  revision matching; shared UI primitives are reusable and accessible; every
  disabled action can expose a reason; first-visit sample follows PRD rules;
  only the latest workspace is persisted; users can clear saved workspace data;
  10 MB input is rejected; disabled reasons work via a focusable wrapper.
