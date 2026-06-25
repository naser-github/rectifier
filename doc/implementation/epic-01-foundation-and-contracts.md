# Epic 01: Foundation and Contracts Execution Plan

> **Required workflow:** Normal implementation workflow, with UI Feature review
> for the minimal visual shell.

**Goal:** Create a runnable, tested static client and establish the source
boundaries and shared contracts that later epics depend on.

**Exit milestone:** Foundation Ready

## Why This Epic Exists

Later work needs stable tools, strict TypeScript, known file ownership, and
shared names. Starting feature work before these basics exist would make every
epic invent its own types and structure.

This epic intentionally creates only a minimal workspace. It does not build the
complete product interface.

## Scope

- Vite, React, TypeScript, Tailwind, Vitest, Testing Library, and Playwright
  setup.
- ESLint, Prettier, and dependency-cruiser quality enforcement.
- Runtime dependencies selected in the roadmap.
- Minimal light workspace shell used to prove rendering and styling setup.
- Base global CSS, Prompt font, and `cn()` helper.
- Initial diagnostics, repair, result, and worker protocol contracts.
- Architecture import-boundary tests.

## Out of Scope

- Repair rules.
- Worker message handling.
- Complete editor, result, schema, or repair interface.
- Final visual polish.

## Dependencies and References

- Requires Epic 00 Docker Runtime Ready.
- Read: `AGENTS.md`, `doc/brd.md`, `doc/prd.md` sections 4 and 17, and
  `doc/ui/rectifier-light-v1.html`.

## Owned Files

```text
package.json
package-lock.json
eslint.config.js
.prettierrc.json
.prettierignore
.dependency-cruiser.mjs
vite.config.ts
vitest.config.ts
playwright.config.ts
postcss.config.js
tailwind.config.ts
tsconfig.json
index.html
src/app/main.tsx
src/app/App.tsx
src/domain/diagnostics.ts
src/domain/repair.ts
src/domain/result.ts
src/domain/workerProtocol.ts
src/lib/cn.ts
src/styles/global.css
tests/architecture/importBoundaries.test.ts
tests/components/App.test.tsx
tests/domain/contracts.test.ts
```

## Execution Policy

### Entry Gate

- The Project Orchestrator confirms the repo is still safe to scaffold.
- Existing documents and prototype files must remain unchanged.
- Dependency versions must be compatible with a static browser build.

### Work and Review Policy

- Execute numbered tasks in order.
- Use test-first implementation for application and contract behavior.
- The Project Orchestrator checks stack and product constraints.
- The Code Reviewer checks configuration, strict types, and source boundaries.
- The UI Reviewer checks Task 01.2 typography, palette, borders, and base
  three-section layout.
- Any shared contract change after this epic requires Orchestrator approval.

### Completion Policy

Do not mark Foundation Ready until the app renders, all base tests pass, a
production build succeeds, and later epics can import stable domain contracts.

## Planning Usage Budget

These early estimates include planned Orchestrator, Worker, and required
specialist Reviewer executions. The Orchestrator refines usage and cost before
each task starts.

| Task | Estimated Agent Tokens | Planning Retry Reserve | Confidence | Estimate Basis |
| --- | ---: | ---: | --- | --- |
| 01.1 Create the Static Client Toolchain | 75k-125k | Up to 35k | Medium | Multi-tool configuration, dependency setup, tests, and Code review |
| 01.2 Prove the Minimal Application Shell | 50k-90k | Up to 25k | Medium | Small UI build with component tests and UI review |
| 01.3 Establish Shared Domain Contracts | 90k-150k | Up to 40k | Low | Cross-epic contracts require careful review and likely rework |
| 01.4 Enforce Architecture Boundaries | 60k-100k | Up to 25k | Medium | Focused dependency rules, tests, and Code review |
| **Epic Total** | **275k-465k** | **Up to 125k** | **Low** | **First epic has no accepted Rectifier tasks for comparison** |

## Tasks

### Task 01.1: Create the Static Client Toolchain

- [x] Initialize the npm package without replacing existing documentation.
- [x] Add `dev`, `build`, `lint`, `format:check`, `architecture`, `typecheck`,
  `test`, and `e2e` scripts.
- [x] Install the runtime and development libraries listed in the roadmap.
- [x] Configure Vite, ESLint, Prettier, dependency-cruiser, Vitest with jsdom,
  and Playwright.
- [x] Configure strict TypeScript plus `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters`.
- [x] Confirm lint, formatting, type checking, and the production build execute
  successfully.

### Task 01.2: Prove the Minimal Application Shell

- [x] Write `tests/components/App.test.tsx` to require Input JSON, Actions, and
  Result headings.
- [x] Run the focused test and confirm it fails before the shell exists.
- [x] Add `main.tsx`, `App.tsx`, Prompt font loading, and the minimal light
  paper workspace.
- [x] Add Tailwind through `global.css` using the styling rules in `AGENTS.md`.
- [x] Add `cn()` using `clsx` and `tailwind-merge`.
- [x] Run the focused test and confirm it passes.

### Task 01.3: Establish Shared Domain Contracts

- [x] Apply the `interface` and `type` policy from `AGENTS.md`: use interfaces
  for stable object-shaped public contracts and boundary APIs, and types for
  discriminated unions and composed aliases.
- [x] Define `Diagnostic` with source position, reliability, and repair state.
- [x] Define `SyntaxEdit`, `RepairCandidate`, verification result, and
  `safe | ambiguous | manual` analysis outcomes.
- [x] Define repair-eligibility metadata that reports whether a supported repair
  rule may apply without generating or exposing a candidate.
- [x] Define `ResultDocument` formats and source actions.
- [x] Define revision-based worker request and response discriminated unions
  for source document, formatting, repair, conversion, and schema actions.
- [x] Define an ephemeral result-validation request that never replaces the
  protected source-document revision.
- [x] Define the initial worker protocol boundary. Later epics must define
  small replaceable interfaces for their owned browser boundaries when tests
  need substitution.
- [x] Use readonly fields at contract boundaries where mutation is not
  intended.
- [x] Keep contracts serializable and free from React, DOM, CodeMirror, and
  Worker implementation imports.

### Task 01.4: Enforce Architecture Boundaries

- [x] Add import-boundary tests proving `src/engine/` cannot depend on React,
  DOM, CodeMirror, or worker adapter files.
- [x] Add architecture checks for inward dependency direction, circular
  imports, cross-feature private deep imports, and unapproved broad barrel
  files using dependency-cruiser rules.
- [x] Add type-level coverage for every worker request and response variant.
- [x] Verify expected domain outcomes use explicit result types instead of
  exceptions.
- [x] Record the accepted contracts in the Worker handoff.

## Verification

```bash
npm run lint
npm run format:check
npm run architecture
npm run typecheck
npm test -- --run tests/components/App.test.tsx \
  tests/architecture/importBoundaries.test.ts
npm run build
```

Expected result: all commands pass and no existing product document is removed
or replaced.

## Acceptance Checklist

- [x] Static application and test tools are runnable.
- [x] Strict TypeScript is enabled.
- [x] ESLint and Prettier checks pass.
- [x] dependency-cruiser architecture checks pass without an allowlist.
- [x] The shell renders the core light palette, Prompt font, monospace code
  style, thin borders, and three-section base layout.
- [x] Shared contracts use discriminated unions and exact product names.
- [x] Public object contracts and the initial worker boundary follow the
  documented interface policy.
- [x] Pure-engine import boundaries are test-enforced.
- [x] Circular imports and invalid dependency directions are test-enforced.
- [x] Code Reviewer approves toolchain, contracts, and architecture work.
- [x] UI Reviewer approves the minimal visual shell.

## Handoff to Later Epics

Provide the accepted domain contract names, available npm scripts, source
boundaries, and any version-specific library notes. Epic 02 may then implement
the pure repair engine without waiting for the complete interface.
