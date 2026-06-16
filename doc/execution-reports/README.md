# Rectifier Execution Reporting

## 1. Purpose

Every Rectifier task and epic must show:

- What work was completed.
- Which providers, models, and agent roles performed the work.
- The implementation-plan usage estimate made before execution planning.
- The estimated usage cost before work started.
- The reported usage and calculated cost after work finished.
- The final task and epic totals.

The Project Orchestrator owns these reports. Workers and Reviewers provide
execution details in their handoffs.

## 2. Required Files

Create reports only when an epic or task starts:

```text
doc/execution-reports/
  pricing.yml
  templates/
    task-report.md
    epic-report.md
  epic-02/
    epic-report.md
    tasks/
      task-02.1.md
      task-02.2.md
```

Use the exact epic and task numbers from `doc/implementation.md` and the
assigned epic plan.

## 3. Report Lifecycle

During implementation planning:

1. Add an estimated agent-token range for every task in the detailed epic
   plan.
2. Add a separate planning retry reserve and confidence level.
3. Record an estimate basis using task scope, required workflows, required
   reviewers, and comparable accepted work when available.

Before an epic starts:

1. Show the mandatory Epic Start Reminder from `AGENTS.md`.
2. Wait for clear user approval.
3. Create its `epic-report.md` from the epic template.
4. Copy the epic's implementation-plan usage budget into the report.

Before a task starts:

1. Create its task report from the task template.
2. Copy the task's implementation-plan estimate and planning retry reserve.
3. Record planned roles, providers, exact models, and billing types.
4. Refine the estimated usage, usage cost, estimate basis, and retry reserve.
5. If the refined estimate exceeds the implementation-plan upper bound, update
   the epic plan and record the reason before execution.
6. Put the task report, epic report, and pricing registry paths in the task
   brief.

After every Orchestrator, Worker, Reviewer, retry, fallback, or rework
execution:

1. Add one execution row with a unique execution ID.
2. Record the actual provider and exact model.
3. Tag the execution with one task or mark it as shared epic overhead.
4. Record usage values exposed by the runner or provider.
5. Calculate cost using the matching pricing registry entry when possible.
6. Record `Unavailable` and the reason when exact evidence is missing.

Before accepting a task:

1. Complete the task cost summary.
2. Confirm every execution is recorded.
3. Update the epic report.

Before accepting an epic:

1. Reconcile the epic report against every accepted task report.
2. Add shared epic overhead that cannot be assigned to one task.
3. Record the epic totals and final status.

## 4. Execution Boundaries

One execution record represents one measured agent run or provider response.
Use task-specific runs when the runner supports them so usage can be assigned
to the correct task.

If one measured execution covers more than one task:

- Record it as shared epic overhead.
- Do not split it evenly between tasks.
- Do not guess a percentage for each task.
- Keep each affected task's direct cost separate from shared epic overhead.

Use task or epic metadata in the runner when available:

```text
epic_id
task_id
execution_id
agent_role
```

## 5. Planning and Refining Estimates

The implementation plan must estimate each task before exact agent routing is
selected. Use a range because provider, model, cache, and retry details may
still change. The range is a combined token proxy for planned Orchestrator,
Worker, and required Reviewer executions. It is not actual usage and is not a
provider-neutral cost calculation.

Before execution, refine each planned execution from the best available
evidence:

- Measured usage from a comparable accepted task.
- A planned input, output, request, tool, time, or other provider billing
  budget.
- The exact provider, model, processing tier, billing type, and current pricing
  entry.

Record the assumptions and calculation basis. Keep planning and execution retry
reserves separate from the normal estimate. Preserve the source
implementation-plan estimate in task and epic reports. Estimates may be
uncertain, but they must be clearly labeled and must not later replace
actual-or-unavailable results.

## 6. Required Cost Labels

Use these labels exactly:

- `Implementation-plan agent tokens`: early combined token range recorded in
  the detailed epic plan.
- `Planning retry reserve`: early token reserve recorded in the detailed epic
  plan.
- `Refined estimated usage`: routing-specific forecast made before execution.
- `Estimated usage cost`: forecast made before execution.
- `Estimated budget`: estimated usage cost plus retry reserve.
- `Calculated usage cost`: reported usage multiplied by recorded prices.
- `API-equivalent cost`: comparison using API prices when the execution used a
  subscription, local model, or another non-API billing method.
- `Billed cost`: amount proven by a provider invoice or billing dashboard.
- `Unavailable`: exact evidence is not exposed; always include the reason.

Do not call a calculated or API-equivalent cost a billed cost.

## 7. Provider-Neutral Calculation

Providers can charge for different usage dimensions. A pricing entry may
include:

- Input tokens.
- Cached-input tokens.
- Cache-read tokens.
- Cache-write tokens.
- Output tokens.
- Reasoning tokens when billed separately.
- Requests.
- Tool calls.
- Images or other media.
- Execution time.
- Infrastructure.

Calculate only the dimensions charged by the provider:

```text
Calculated usage cost =
  sum(reported usage dimension x matching provider rate)
```

When a rate is stated per one million units:

```text
Dimension cost = reported units x rate per million / 1,000,000
```

Do not charge one usage unit twice. For example, if cached input is included in
total input, subtract cached input before applying the normal input rate.

## 8. Evidence Rules

Allowed actual-usage sources:

- Runner usage output.
- Provider API response.
- Provider usage dashboard.
- Provider invoice.

Rules:

- Estimated values may be forecasts, but must be labeled `Estimated`.
- Actual usage and cost must never be guessed.
- If exact usage is missing, write `Unavailable` and explain why.
- If pricing is missing, usage may still be recorded while calculated cost is
  `Unavailable`.
- Record the pricing source, currency, effective date, and date checked.
- Record planned and actual routing when they differ, with the change reason.
- Do not combine different currencies unless the report records the exchange
  rate, source, and date used.

## 9. Billing Types

### API

Record calculated usage cost. Record billed cost only when billing evidence is
available.

### Subscription

Record billed cost as `Included in subscription` when appropriate. Keep any
API-equivalent cost separate.

### Local Model

Record API cost as zero when no API is used. Record infrastructure cost only
when measured; otherwise use `Unavailable`.

### Other

Record the provider's billing unit and calculation method in the pricing
registry and task report.

## 10. Pricing Registry

`doc/execution-reports/pricing.yml` is the source for calculation rates.

Do not store a price without its provider, exact model, billing type, currency,
effective date, checked date, and source. Do not silently reuse stale pricing.

Add one entry for every provider/model/rate combination used by a calculated
report. Different processing tiers or context bands require separate entries.

## 11. Ownership

- Project Orchestrator: creates and updates task and epic reports.
- Worker and Reviewers: report actual routing and available usage evidence in
  handoffs.
- No agent guesses actual usage or cost.
- Report files are Orchestrator-owned and do not expand a Worker's code-file
  ownership.
