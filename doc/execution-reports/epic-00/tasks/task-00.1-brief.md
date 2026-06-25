# Task Brief: Define Docker Runtime Files

## Source Epic

- `doc/implementation.md`: Epic 00 Docker Runtime Foundation
- `doc/implementation/epic-00-docker-runtime-foundation.md`

## Source Task

- Task 00.1 Define Docker Runtime Files

## Required Workflow

- Normal Task

## Workflow Reason

- This task adds Docker runtime configuration only.
- It does not change product UI, repair behavior, shared contracts, or user-facing behavior.
- Code review is required by the Epic 00 work and review policy for Docker, Compose, and run-command correctness.

## Required Specialist Reviewers

- Code Reviewer

## Agent Routing

- Provider: OpenAI
- Role: Normal Task Worker
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: gpt-5.4 or inherited Codex worker model
- Billing type: Subscription/API-equivalent unavailable
- Processing tier: Priority when available
- Routing reason: Task is focused normal configuration work with no repair, UI, shared-contract, or release approval risk.
- Allowed tools: Read repository files, edit owned files, run `docker compose config`, inspect diffs.
- Required context: `AGENTS.md`, `doc/brd.md`, `doc/prd.md`, `doc/implementation.md`, `doc/implementation/epic-00-docker-runtime-foundation.md`, `doc/agent-workflow.md`, `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, `doc/ui/rectifier-light-v1.html`, this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review finding.
- Escalation trigger: Docker runtime requires a backend or extra service, `docker compose config` fails twice, or Worker needs files outside ownership.
- Fallback: Same-tier or higher-tier model.

## Execution Reporting

- Task report: `doc/execution-reports/epic-00/tasks/task-00.1.md`
- Epic report: `doc/execution-reports/epic-00/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 45k-75k
- Implementation-plan retry reserve: Up to 20k
- Refined estimated usage: Estimated 45k-75k agent tokens
- Refined estimated usage cost: Unavailable because the pricing registry has no active entries and runner billing dimensions are not exposed
- Refinement basis: Focused Dockerfile, Compose, ignore rules, required Code Reviewer pass, and one verification command
- Plan variance: Within plan
- Retry reserve: Up to 20k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Create the Docker runtime foundation files for one Docker Compose app service that builds and serves the future static client without adding a backend or extra runtime service.

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

- No earlier epic dependency.
- Project Orchestrator confirmed user approval to start Epic 00.
- Current branch is `development`; user approved working in this branch.

## Required Contracts and Interfaces

- None. No source contracts exist in this task.

## Dependency Boundaries

- Docker is packaging and static serving only.
- Do not add a backend, database, cache, queue, AI service, model sidecar, account service, or server route that receives user JSON.
- Preserve the BRD and PRD rule that user JSON stays in the browser.

## File Ownership

- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`

## Do Not Change

- `src/`
- `doc/brd.md`
- `doc/prd.md`
- `doc/ui/rectifier-light-v1.html`
- Product behavior, repair behavior, UI behavior, shared contracts, or unrelated docs

## Required Behavior

- `Dockerfile` uses a Node build stage for the future Vite static client.
- Runtime container serves only built `dist/` assets.
- Runtime must not expose routes that process user JSON.
- `.dockerignore` excludes local dependencies, build output, Git metadata, environment files, Playwright output, coverage, and execution reports.
- `docker-compose.yml` defines exactly one application service.
- The app service exposes one local HTTP port.
- Compose validation must parse successfully.

## Required Tests

- No unit tests are required because no source behavior exists.
- Required verification is Compose validation.

## Verification Commands

```bash
docker compose config
```

## Handoff Requirements

- Changed files
- Verification command and result
- Known limitations
- Open questions
