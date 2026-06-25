# Task Brief: Implement Automatic Validation and Error Focus

## Source Epic
- `doc/implementation.md`: Epic 03 Worker and Validation
- `doc/implementation/epic-03-worker-and-validation.md`

## Source Task
- Task 03.4 Implement Automatic Validation and Error Focus

## Required Workflow
- UI Feature Task (with required Code review)

## Workflow Reason
- Creates user-facing editor, error decorations, focus/red-caret, and Error Tray
  (UI review required), plus the auto-validation coordination hook and
  diagnostics-to-decoration logic (Code review required). Epic 03 policy requires
  both Code and UI Reviewer approval for Task 03.4.

## Required Specialist Reviewers
- UI Reviewer
- Code Reviewer

## Agent Routing
- Provider: Anthropic
- Role: Task Worker (UI feature)
- Capability tier: Tier B
- Reasoning level: Medium
- Exact model for this run: claude-sonnet-4-6
- Billing type: Subscription
- Processing tier: Not applicable
- Routing reason: Focused editor/UI integration against accepted contracts. No
  repair-rule or shared-protocol change. Code Reviewer is Tier A.
- Allowed tools: Read, Edit/Write owned files, Bash for focused tests, typecheck,
  build
- Required context: `AGENTS.md`, `doc/agent-workflow.md`,
  `doc/agent-model-routing.md`, `doc/execution-reports/README.md`, this brief,
  the Epic 03 plan, `doc/prd.md` sections 6, 7, 16, `doc/ui/rectifier-light-v1.html`,
  `src/domain/diagnostics.ts`, `src/domain/workerProtocol.ts`,
  `src/hooks/useWorkerClient.ts`, `src/lib/size.ts`, `src/lib/files.ts`,
  `src/styles/global.css`
- Retry limit: 1 retry per failed implementation or unresolved finding
- Escalation trigger: CodeMirror behavior cannot be tested in jsdom, a contract
  must change, or the task fails twice — then escalate to Tier A `claude-opus-4-8`
- Fallback: escalate to Tier A `claude-opus-4-8` on repeated failure

## Execution Reporting
- Task report: `doc/execution-reports/epic-03/tasks/task-03.4.md`
- Epic report: `doc/execution-reports/epic-03/epic-report.md`
- Pricing registry: `doc/execution-reports/pricing.yml`
- Implementation-plan agent tokens: 110k-190k
- Implementation-plan retry reserve: Up to 50k
- Refined estimated usage: Unavailable (subscription runner does not expose
  per-run token usage)
- Refined estimated usage cost: Unavailable: subscription runner billing
  dimensions are not exposed
- Refinement basis: Largest Epic 03 task; cross-boundary editor/worker/focus
  integration. Subscription runner exposes no per-run usage.
- Plan variance: Within plan
- Retry reserve: Up to 50k estimated agent tokens
- Report owner: Project Orchestrator

## Goal
Provide an input CodeMirror editor with JSON highlighting, line numbers, and
folding; automatic debounced validation through the worker; confirmed-error
decoration, first-error focus with a red caret; and an Error Tray whose items
focus their exact source location — with stale results never overwriting current
state.

## Required Reading
- `AGENTS.md` (esp. §4 boundaries, §6 React/TS, §7 Tailwind/CSS, §8 shared UI,
  §11 accessibility, §12 performance)
- `doc/agent-workflow.md`, `doc/agent-model-routing.md`,
  `doc/execution-reports/README.md`
- `doc/implementation/epic-03-worker-and-validation.md` (Task 03.4)
- `doc/prd.md` sections 6.1, 7.1, 7.2, 7.3, 16
- `doc/ui/rectifier-light-v1.html` (approved visual direction; do not edit it)
- `src/domain/diagnostics.ts`, `src/domain/workerProtocol.ts`,
  `src/hooks/useWorkerClient.ts`, `src/styles/global.css`

## Dependencies
- Tasks 03.1 (worker client), 03.2 (diagnostics), 03.3 (size/files) — all Accepted

## Required Contracts and Interfaces
- Consume `Diagnostic` (`src/domain/diagnostics.ts`) and the worker
  `source-validated` response (`src/domain/workerProtocol.ts`) as-is. Do NOT
  change any `src/domain/**` or worker-protocol contract; escalate if needed.
- Use the existing `useWorkerClient` / `createWorkerClient` API
  (`src/hooks/useWorkerClient.ts`) to talk to the worker. Do NOT change it.
- Use `src/lib/size.ts` (`checkPasteSize`, predicates) for paste/typed-size
  guarding in the validation hook.

## Dependency Boundaries
- Components (`src/components/`) may use hooks and domain contracts but must NOT
  call parsing/repair/conversion/schema logic directly.
- The hook (`src/hooks/`) coordinates the worker client and browser/UI state.
- No business logic (parsing/repair) in the editor or tray; diagnostics come
  only from worker responses.
- Keep editor styling as CodeMirror theme/decoration EXTENSIONS within owned
  files, using the existing design tokens already defined in
  `src/styles/global.css` `:root` (e.g. red accent). Do NOT edit `global.css`;
  if a global CodeMirror override is genuinely unavoidable, STOP and escalate.
- No circular imports; no deep cross-feature private imports; direct imports
  only.

## File Ownership
- Create: `src/hooks/useAutoValidation.ts`
- Create: `src/components/editor/InputEditor.tsx`
- Create: `src/components/editor/errorDecorations.ts`
- Create: `src/components/errors/ErrorTray.tsx`
- Create: `tests/components/InputEditor.test.tsx`
- Create: `tests/components/ErrorTray.test.tsx`
- Create: `tests/components/errorDecorations.test.ts`
- Create: `tests/hooks/useAutoValidation.test.tsx`

## Do Not Change
- `src/domain/**`, `src/engine/**`, `src/worker/**`, `src/hooks/useWorkerClient.ts`
- `src/lib/**`, `src/styles/global.css`, `src/app/**`
- `doc/ui/rectifier-light-v1.html`
- Existing tests; report files (Orchestrator-owned)

## Required Behavior
- `src/components/editor/errorDecorations.ts` (keep PURE/testable):
  - From confirmed diagnostics + the document, compute CodeMirror decoration
    ranges over each confirmed error location (a visible mark/line highlight;
    derive a sensible range when only an offset is known).
  - Provide `firstConfirmedError(diagnostics)` returning the earliest confirmed
    error (by offset), or none.
  - Only `reliability: "confirmed"` diagnostics are decorated/focusable; never
    `uncertain-follow-on`.
  - Error indication must not rely on color alone (PRD 16) — pair the red mark
    with a non-color cue (e.g. underline/gutter marker/aria).
- `src/components/editor/InputEditor.tsx`:
  - CodeMirror 6 with `@codemirror/lang-json` highlighting, line numbers, and
    code folding for objects/arrays.
  - Controlled value + `onChange(text)`; do not mutate the caller's value.
  - Apply error decorations from a `diagnostics` prop.
  - On new confirmed diagnostics, focus and scroll the first confirmed error into
    view and show a RED caret while an error is focused (CodeMirror theme
    extension using the existing red design token).
  - Accept a focus request (prop or imperative handle) so the Error Tray can
    focus a specific diagnostic's exact source location.
  - Accessible: keyboard usable, visible focus, accessible names.
- `src/components/errors/ErrorTray.tsx`:
  - List confirmed diagnostics with plain message and line/column.
  - Each item is keyboard-activatable and, when activated, requests focus of its
    exact source location.
  - Not color-alone; accessible names; visible focus.
- `src/hooks/useAutoValidation.ts`:
  - Debounce normal typing by 300 ms before validating.
  - Validate uploaded-file content immediately (no debounce).
  - Send source per revision via the worker client; surface diagnostics +
    eligibility from `source-validated`.
  - Guard paste/typed input over the 10 MB limit using `src/lib/size.ts` and keep
    the last accepted revision.
  - Ignore stale responses (rely on the client's job/revision filtering; also
    guard against applying diagnostics for a superseded revision).

## Required Tests
- `errorDecorations.test.ts`: only confirmed diagnostics decorated; follow-on
  excluded; `firstConfirmedError` picks earliest by offset; offset→range mapping
  correct; non-color cue present.
- `InputEditor.test.tsx`: renders with JSON highlighting/line numbers/folding
  configured; reflects value and calls `onChange`; applies decorations for
  confirmed diagnostics; focuses first confirmed error and applies the red-caret
  state; a focus request moves to the requested location. (Test at the level
  jsdom supports; do not assert pixel scrolling — assert configuration,
  callbacks, selection/caret state, and applied classes/extensions.)
- `ErrorTray.test.tsx`: lists confirmed diagnostics with message + line/column;
  keyboard activation triggers the focus callback with the right location; not
  color-alone; accessible names present.
- `useAutoValidation.test.tsx`: 300 ms debounce for typing (fake timers);
  immediate validation for uploads; stale responses do not overwrite newer
  diagnostics; over-limit paste keeps the last accepted revision. Use a fake
  `WorkerLike` / injected worker client.

## Verification Commands
```bash
npm test -- --run tests/components/InputEditor.test.tsx tests/components/ErrorTray.test.tsx tests/components/errorDecorations.test.ts tests/hooks/useAutoValidation.test.tsx
npm run typecheck
npm run architecture
npm run lint
npm run format:check
npm run build
```

## Handoff Requirements
- Changed files with one-line reasons
- Each verification command and PASS/FAIL result (paste failing output if any)
- Confirmation no domain/worker-protocol contract and no `global.css` were changed
- Confirmation diagnostics come only from worker responses (no parsing in UI)
- Accessibility notes (keyboard, non-color error cue, focus visibility)
- Known limitations (esp. any CodeMirror behavior not testable in jsdom) and
  open questions
- `Agent Routing Used` and `Execution Usage` blocks per
  `doc/agent-workflow.md` section 6 (report `Unavailable` for usage with the
  subscription-runner reason; do not guess)
