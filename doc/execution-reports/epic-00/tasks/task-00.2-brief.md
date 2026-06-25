# Task Brief: Document and Verify Docker Runtime

## Source Epic

- `doc/implementation.md`: Epic 00 Docker Runtime Foundation
- `doc/implementation/epic-00-docker-runtime-foundation.md`

## Source Task

- Task 00.2 Document and Verify Docker Runtime

## Required Workflow

- Normal Task

## Workflow Reason

- This task documents and verifies Docker runtime configuration only.
- It does not change product UI, repair behavior, shared contracts, or user-facing behavior.
- Code review is required by the Epic 00 work and review policy for Docker, Compose, and run-command correctness.

## Required Specialist Reviewers

- Code Reviewer

## Agent Routing

- Provider: OpenAI
- Role: Normal Task Worker
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: GPT-5 Codex session model
- Billing type: Subscription/API-equivalent unavailable
- Processing tier: Not exposed
- Routing reason: Task is focused documentation plus runtime verification with no repair, UI, shared-contract, or release approval risk.
- Allowed tools: Read repository files, edit owned files, run `docker compose config`, run documented Docker startup command when available, inspect diffs.
- Required context: `AGENTS.md`, `doc/brd.md`, `doc/prd.md`, `doc/implementation.md`, `doc/implementation/epic-00-docker-runtime-foundation.md`, `doc/agent-workflow.md`, `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, `doc/ui/rectifier-light-v1.html`, this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review finding.
- Escalation trigger: Docker documentation requires a backend or extra service, `docker compose config` fails twice, documented startup cannot be represented honestly, or Worker needs files outside ownership.
- Fallback: Same-tier or higher-tier model.

## Execution Reporting

- Task report: `doc/execution-reports/epic-00/tasks/task-00.2.md`
- Epic report: `doc/execution-reports/epic-00/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 35k-60k
- Implementation-plan retry reserve: Up to 15k
- Refined estimated usage: Estimated 35k-60k agent tokens
- Refined estimated usage cost: Unavailable because the pricing registry has no active entries and runner billing dimensions are not exposed
- Refinement basis: Run-guide update, README link, Compose verification, optional Docker daemon check, and required Code Reviewer pass
- Plan variance: Within plan
- Retry reserve: Up to 15k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Document the one-service Docker Compose runtime and verify that Compose parses successfully, while recording Docker daemon startup availability honestly.

## Required Reading

- `AGENTS.md`
- `doc/brd.md`
- `doc/prd.md`
- `doc/ui/rectifier-light-v1.html`
- `doc/implementation.md`
- `doc/implementation/epic-00-docker-runtime-foundation.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`

## Dependencies

- Task 00.1 accepted.

## Required Contracts and Interfaces

- None. No source contracts exist in this task.

## Dependency Boundaries

- Docker is packaging and static serving only.
- Do not add a backend, database, cache, queue, AI service, model sidecar, account service, or server route that receives user JSON.
- Preserve the BRD and PRD rule that user JSON stays in the browser.

## File Ownership

- Create: `doc/RUN.md`
- Modify: `README.md`

## Do Not Change

- Product behavior, repair behavior, UI behavior, shared contracts, source files, or unrelated docs.
- Do not modify `Dockerfile`, `.dockerignore`, or `docker-compose.yml` unless verification proves Task 00.1 missed a blocker.

## Required Behavior

- `doc/RUN.md` documents Docker Compose run commands.
- `doc/RUN.md` states Docker Compose starts one app container only.
- `doc/RUN.md` states no backend, database, AI service, or account service is required.
- `README.md` links to `doc/RUN.md`.
- Run `docker compose config`.
- If Docker daemon access is available, run the documented Docker startup command and record the result.
- If Docker daemon access is unavailable, record it as `Unavailable` in the task report and keep `docker compose config` as the verified check.

## Required Tests

- No unit tests are required because no source behavior exists.
- Required verification is Compose validation and Docker startup availability check.

## Verification Commands

```bash
docker compose config
docker compose up --build
```

## Handoff Requirements

- Changed files
- Verification commands and results
- Known limitations
- Open questions
