# Epic 01: Foundation and Contracts Execution Plan

> **Required workflow:** Normal implementation workflow from
> `doc/agent-workflow.md`.

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

- No earlier epic dependency.
- Read: `AGENTS.md`, `doc/brd.md`, `doc/prd.md` sections 4 and 17, and
  `doc/ui/rectifier-light-v1.html`.

## Owned Files

```text
package.json
package-lock.json
vite.config.ts
vitest.config.ts
playwright.config.ts
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
```

## Execution Policy

### Entry Gate

- The Project Orchestrator confirms the repo is still safe to scaffold.
- Existing documents and prototype files must remain unchanged.
- Dependency versions must be compatible with a static browser build.

### Work and Review Policy

- Execute numbered tasks in order.
- Use test-first implementation for application and contract behavior.
- The Requirements Reviewer checks stack and product constraints.
- The Code Reviewer checks configuration, strict types, and source boundaries.
- Any shared contract change after this epic requires Orchestrator approval.

### Completion Policy

Do not mark Foundation Ready until the app renders, all base tests pass, a
production build succeeds, and later epics can import stable domain contracts.

## Tasks

### Task 01.1: Create the Static Client Toolchain

- [ ] Initialize the npm package without replacing existing documentation.
- [ ] Add `dev`, `build`, `typecheck`, `test`, and `e2e` scripts.
- [ ] Install the runtime and development libraries listed in the roadmap.
- [ ] Configure Vite, strict TypeScript, Vitest with jsdom, and Playwright.
- [ ] Confirm `npm run typecheck` and `npm run build` execute successfully.

### Task 01.2: Prove the Minimal Application Shell

- [ ] Write `tests/components/App.test.tsx` to require Input JSON, Actions, and
  Result headings.
- [ ] Run the focused test and confirm it fails before the shell exists.
- [ ] Add `main.tsx`, `App.tsx`, Prompt font loading, and the minimal light
  paper workspace.
- [ ] Add Tailwind through `global.css` using the styling rules in `AGENTS.md`.
- [ ] Add `cn()` using `clsx` and `tailwind-merge`.
- [ ] Run the focused test and confirm it passes.

### Task 01.3: Establish Shared Domain Contracts

- [ ] Define `Diagnostic` with source position, reliability, and repair state.
- [ ] Define `SyntaxEdit`, `RepairCandidate`, verification result, and
  `safe | ambiguous | manual` analysis outcomes.
- [ ] Define `ResultDocument` formats and source actions.
- [ ] Define revision-based worker request and response discriminated unions
  for source document, formatting, repair, conversion, and schema actions.
- [ ] Define an ephemeral result-validation request that never replaces the
  protected source-document revision.
- [ ] Keep contracts serializable and free from React, DOM, CodeMirror, and
  Worker implementation imports.

### Task 01.4: Enforce Architecture Boundaries

- [ ] Add import-boundary tests proving `src/engine/` cannot depend on React,
  DOM, CodeMirror, or worker adapter files.
- [ ] Add type-level coverage for every worker request and response variant.
- [ ] Record the accepted contracts in the Worker handoff.

## Verification

```bash
npm run typecheck
npm test -- --run tests/components/App.test.tsx \
  tests/architecture/importBoundaries.test.ts
npm run build
```

Expected result: all commands pass and no existing product document is removed
or replaced.

## Acceptance Checklist

- [ ] Static application and test tools are runnable.
- [ ] Strict TypeScript is enabled.
- [ ] The shell renders the core light palette, Prompt font, monospace code
  style, thin borders, and three-section base layout.
- [ ] Shared contracts use discriminated unions and exact product names.
- [ ] Pure-engine import boundaries are test-enforced.
- [ ] Requirements Reviewer and Code Reviewer approve.

## Handoff to Later Epics

Provide the accepted domain contract names, available npm scripts, source
boundaries, and any version-specific library notes. Epic 02 may then implement
the pure repair engine without waiting for the complete interface.
