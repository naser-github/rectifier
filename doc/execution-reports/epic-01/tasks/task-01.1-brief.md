# Task Brief: Create the Static Client Toolchain

## Source Epic

- `doc/implementation.md`: Epic 01 Foundation and Contracts
- `doc/implementation/epic-01-foundation-and-contracts.md`

## Source Task

- Task 01.1 Create the Static Client Toolchain

## Required Workflow

- Normal Task

## Workflow Reason

- This task creates the static client toolchain and quality gates.
- It does not create repair behavior, shared domain contracts, or user-facing product UI beyond minimal build entry placeholders.
- Code review is required for configuration, strict types, dependency setup, and source boundaries.

## Required Specialist Reviewers

- Code Reviewer

## Agent Routing

- Provider: OpenAI
- Role: Normal Task Worker
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: gpt-5.4 or GPT-5 Codex session model
- Billing type: API-equivalent/subscription unavailable
- Processing tier: Standard/Not exposed
- Routing reason: Focused implementation setup with known stack and required checks; no repair-safety or UI specialist work in this task.
- Allowed tools: Read repository files, edit owned files, install dependencies, run npm scripts, inspect diffs.
- Required context: `AGENTS.md`, `doc/brd.md`, `doc/prd.md` sections 4 and 17, `doc/implementation.md`, `doc/implementation/epic-01-foundation-and-contracts.md`, `doc/agent-workflow.md`, `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, `doc/ui/rectifier-light-v1.html`, this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review finding.
- Escalation trigger: Dependency installation cannot complete, required checks cannot run after one fix attempt, task needs files outside ownership, or static-client/browser-only constraints conflict.
- Fallback: Same-tier or higher-tier model.

## Execution Reporting

- Task report: `doc/execution-reports/epic-01/tasks/task-01.1.md`
- Epic report: `doc/execution-reports/epic-01/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 75k-125k
- Implementation-plan retry reserve: Up to 35k
- Refined estimated usage: Estimated 75k-125k agent tokens
- Refined estimated usage cost: Unavailable because exact runner billing dimensions are not exposed
- Rough API-equivalent planning cost: Estimated USD $0.55-$0.93 before retry reserve, using planned model tiers, current pricing entries, and an 80% input / 20% output / 0% cached-input assumption
- Refinement basis: Toolchain setup, dependency install, strict TypeScript config, lint/format/typecheck/build commands, and Code Reviewer pass
- Plan variance: Within plan
- Retry reserve: Up to 35k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Create the npm, Vite, React, TypeScript, Tailwind, test, lint, format, architecture, and Playwright toolchain without replacing existing documentation.

## Required Reading

- `AGENTS.md`
- `doc/brd.md`
- `doc/prd.md` sections 4 and 17
- `doc/ui/rectifier-light-v1.html`
- `doc/implementation.md`
- `doc/implementation/epic-01-foundation-and-contracts.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`

## Dependencies

- Epic 00 Docker Runtime Ready is accepted.
- Task 01.1 has no earlier Epic 01 task dependency.

## Required Contracts and Interfaces

- None for this task. Domain contracts are owned by Task 01.3.

## Dependency Boundaries

- Keep Rectifier a static React application.
- Do not add backend routes, server JSON processing, database, account service, AI service, cache, queue, or sidecar.
- Do not remove or replace existing documentation.
- Ignore generated Node, build, coverage, and browser-test output.
- Keep user JSON privacy rules intact.

## File Ownership

- Create: `package.json`
- Create: `package-lock.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `.dependency-cruiser.mjs`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Modify: `.gitignore`

## Do Not Change

- `doc/brd.md`
- `doc/prd.md`
- `doc/ui/rectifier-light-v1.html`
- `src/domain/`
- `src/app/`
- `tests/`
- Product behavior, repair behavior, UI behavior, or shared contracts

## Required Behavior

- Initialize the npm package without replacing existing documentation.
- Add `dev`, `build`, `lint`, `format:check`, `architecture`, `typecheck`, `test`, and `e2e` scripts.
- Install runtime and development libraries listed in the roadmap.
- Configure Vite, ESLint, Prettier, dependency-cruiser, Vitest with jsdom, and Playwright.
- Configure strict TypeScript plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters`.
- Confirm lint, formatting, type checking, and production build execute successfully.

## Required Tests

- No product unit tests are owned by this task.
- Required verification is the configured toolchain commands.

## Verification Commands

```bash
npm run lint
npm run format:check
npm run architecture
npm run typecheck
npm test -- --run
npm run build
```

## Handoff Requirements

- Changed files
- Verification commands and results
- Known limitations
- Open questions
