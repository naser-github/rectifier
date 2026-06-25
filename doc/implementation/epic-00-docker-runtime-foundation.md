# Epic 00: Docker Runtime Foundation Execution Plan

> **Required workflow:** Normal configuration and documentation workflow.

**Goal:** Make Rectifier runnable through one Docker Compose app service without
adding a backend or extra runtime services.

**Exit milestone:** Docker Runtime Ready

## Why This Epic Exists

Rectifier must have a clear Docker runtime before the application scaffold is
created. This prevents later epics from adding ad hoc run commands, extra
services, or a runtime shape that conflicts with the browser-only product.

This epic defines only the runtime foundation. It does not build product
features.

## Scope

- One `docker-compose.yml` app service.
- One production container named `rectifier_app` for the built static client.
- Multi-stage `Dockerfile` that builds the Vite app and serves static files.
- `.dockerignore` that keeps local dependencies, build output, reports, and
  secrets out of the image context.
- Docker run instructions in the project run guide once that file exists.
- Verification that Docker Compose parses correctly.

## Out of Scope

- Backend service.
- Database, cache, queue, AI service, or model sidecar.
- Multi-container local development stack.
- Product UI, repair logic, worker logic, schema logic, or conversion logic.

## Dependencies and References

- No earlier epic dependency.
- Read: `AGENTS.md`, `doc/brd.md`, `doc/prd.md`,
  `doc/implementation.md`, `doc/agent-workflow.md`,
  `doc/agent-model-routing.md`, and `doc/execution-reports/README.md`.

## Owned Files

```text
Dockerfile
.dockerignore
docker-compose.yml
README.md
doc/RUN.md
```

`doc/RUN.md` may be created by this epic if it does not exist. If Epic 09 later
rewrites the final run guide, it must preserve the verified Docker Compose
runtime.

## Execution Policy

### Entry Gate

- The Project Orchestrator confirms no earlier epic has started.
- The runtime still matches the BRD and PRD browser-only privacy rule.
- Docker is treated as a packaging and serving layer only.

### Work and Review Policy

- Execute numbered tasks in order.
- Use Normal Task workflow.
- Code Reviewer checks Docker, Compose, and run-command correctness.
- UI Reviewer and Repair Safety Reviewer are not required because this epic
  does not change product UI or repair behavior.
- Do not add another service unless the BRD, PRD, and roadmap are updated first.

### Completion Policy

Do not mark Docker Runtime Ready until Compose validation passes and the docs
state that Rectifier has one Docker Compose app service and one runtime
container.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required Code
Reviewer executions. The Orchestrator refines usage and cost before each task
starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 00.1 Define Docker Runtime Files | 45k-75k | Up to 20k | Medium | Focused Dockerfile, Compose, ignore rules, and Code review |
| 00.2 Document and Verify Docker Runtime | 35k-60k | Up to 15k | Medium | Run-guide update, README link, Compose verification, and Code review |
| **Epic Total** | **80k-135k** | **Up to 35k** | **Medium** | **Small configuration epic with no product behavior changes** |

## Tasks

### Task 00.1: Define Docker Runtime Files

- [x] Create `Dockerfile` with a Node build stage and a static serving runtime
  stage.
- [x] The runtime container must serve the built `dist/` output only.
- [x] Do not add server routes that receive user JSON.
- [x] Create `.dockerignore` and exclude `node_modules`, `dist`,
  `.git`, `.env`, `.env.*`, Playwright output, coverage, and execution reports.
- [x] Create `docker-compose.yml` with one app service and the fixed container
  name `rectifier_app`.
- [x] Expose one local HTTP port for the app.
- [x] Run `docker compose config`.

### Task 00.2: Document and Verify Docker Runtime

- [x] Create or update `doc/RUN.md` with Docker Compose run commands.
- [x] State that Docker Compose starts one app container only.
- [x] State that no backend, database, AI service, or account service is
  required.
- [x] Update `README.md` to link the run guide.
- [x] Run `docker compose config`.
- [x] If Docker daemon access is available, run the documented Docker startup
  command and record the result.
- [x] Docker daemon access was available; record the documented startup command
  result in the task report and keep `docker compose config` as the verified
  Epic 00 check.

## Verification

```bash
docker compose config
```

Expected result: Compose parses successfully and shows exactly one application
service.

When the app scaffold exists, also run:

```bash
docker compose build
```

Expected result: the image builds and serves the static app without backend
services.

## Acceptance Checklist

- [x] `Dockerfile` builds the static client and serves only built assets.
- [x] `docker-compose.yml` contains one app service and the fixed container name
  `rectifier_app`.
- [x] No backend, database, cache, AI, or sidecar service exists.
- [x] `.dockerignore` excludes dependencies, build output, reports, and secrets.
- [x] Docker run docs are present.
- [x] `docker compose config` passes.
- [x] Code Reviewer approves the runtime configuration.
- [x] Project Orchestrator confirms Docker Runtime Ready.

## Handoff to Later Epics

Provide the verified Docker files, local app URL, exposed port, and any Docker
environment limits. Epic 01 must keep the static-client build compatible with
this runtime.
