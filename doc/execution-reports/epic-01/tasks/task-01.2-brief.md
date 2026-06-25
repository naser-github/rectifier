# Task Brief: Prove the Minimal Application Shell

## Source Epic

- `doc/implementation.md`: Epic 01 Foundation and Contracts
- `doc/implementation/epic-01-foundation-and-contracts.md`

## Source Task

- Task 01.2 Prove the Minimal Application Shell

## Required Workflow

- UI Feature Task

## Workflow Reason

- This task creates the first user-facing visual shell, Prompt font setup, paper workspace, and base interaction landmarks.
- UI review is required for typography, palette, borders, and the three-section layout.

## Required Specialist Reviewers

- UI Reviewer

## Agent Routing

- Provider: OpenAI
- Role: UI Feature Worker
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: GPT-5 Codex session model
- Billing type: Subscription/API-equivalent unavailable
- Processing tier: Not exposed
- Routing reason: Focused UI shell implementation using the approved prototype; no repair logic or shared contracts.
- Allowed tools: Read repository files, edit owned files, run focused component tests and required verification, inspect diffs.
- Required context: `AGENTS.md`, `doc/brd.md`, `doc/prd.md`, `doc/ui/rectifier-light-v1.html`, `doc/implementation.md`, `doc/implementation/epic-01-foundation-and-contracts.md`, `doc/agent-workflow.md`, `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this task brief.
- Retry limit: One Worker retry for failed implementation or unresolved review finding.
- Escalation trigger: The shell requires complete product UI, repair behavior, worker behavior, or files outside approved ownership.
- Fallback: Same-tier or higher-tier model.

## Execution Reporting

- Task report: `doc/execution-reports/epic-01/tasks/task-01.2.md`
- Epic report: `doc/execution-reports/epic-01/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 50k-90k
- Implementation-plan retry reserve: Up to 25k
- Refined estimated usage: Estimated 50k-90k agent tokens
- Refined estimated usage cost: Unavailable because exact runner billing dimensions are not exposed
- Rough API-equivalent planning cost: Estimated USD $0.30-$0.59 before retry reserve, using planned Tier B Worker and UI Reviewer routing with an 80% input / 20% output / 0% cached-input assumption
- Refinement basis: Minimal component test, application shell, Tailwind setup, focused verification, and UI review
- Plan variance: Within plan. `tailwind.config.ts` and `postcss.config.js` are added to file ownership because Tailwind cannot be proven through `global.css` without build configuration.
- Retry reserve: Up to 25k estimated agent tokens
- Report owner: Project Orchestrator

## Goal

Create the minimal Rectifier application shell that renders Input JSON, Actions, and Result headings with the approved light paper direction.

## Required Reading

- `AGENTS.md`
- `doc/brd.md`
- `doc/prd.md` sections 4 and 5
- `doc/ui/rectifier-light-v1.html`
- `doc/implementation.md`
- `doc/implementation/epic-01-foundation-and-contracts.md`
- `doc/agent-workflow.md`
- `doc/agent-model-routing.md`
- `doc/execution-reports/README.md`

## Dependencies

- Task 01.1 Create the Static Client Toolchain accepted.

## Required Contracts and Interfaces

- None. Domain contracts are owned by Task 01.3.

## Dependency Boundaries

- `src/app/` may compose the application shell.
- `src/lib/` may contain small general helpers.
- `src/styles/global.css` may contain Tailwind imports, design tokens, Prompt and monospace font setup, body defaults, paper texture, and accessibility helpers.
- Do not add parsing, repair, conversion, schema, worker, or storage behavior.

## File Ownership

- Create: `tests/components/App.test.tsx`
- Create: `src/app/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/lib/cn.ts`
- Create: `src/styles/global.css`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Modify: `tsconfig.json`
- Modify: `index.html`

## Do Not Change

- `doc/brd.md`
- `doc/prd.md`
- `doc/ui/rectifier-light-v1.html`
- `src/domain/`
- `src/engine/`
- `src/worker/`
- Product behavior, repair behavior, worker behavior, or shared contracts

## Required Behavior

- Write `tests/components/App.test.tsx` to require Input JSON, Actions, and Result headings.
- Confirm the focused test fails before the shell exists.
- Add `main.tsx`, `App.tsx`, Prompt font loading, and the minimal light paper workspace.
- Add Tailwind through `global.css` using the styling rules in `AGENTS.md`.
- Add `cn()` using `clsx` and `tailwind-merge`.
- Confirm the focused test passes.

## Required Tests

- `tests/components/App.test.tsx` verifies the three required headings render.

## Verification Commands

```bash
npm test -- --run tests/components/App.test.tsx
npm run lint
npm run format:check
npm run typecheck
npm run build
```

## Handoff Requirements

- Changed files
- Red and green component-test evidence
- Verification commands and results
- Known limitations
- UI Reviewer attention areas
