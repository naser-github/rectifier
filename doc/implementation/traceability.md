# Rectifier v1 Requirements Traceability

## BRD Business Rules

| BRD Rule | Epic Task | Coverage |
| --- | --- | --- |
| Original input is protected | 04 Core Workspace | InputPanel never replaces source; worker uses stored revision |
| No silent data changes | 02 Strict Repair Engine | Engine returns safe/ambiguous/manual results explicitly |
| User must accept repairs | 05 Repair Experience | RepairPreviewDialog with Accept/Reject |
| Ambiguous repairs show choices | 05 Repair Experience | RepairChoiceDialog with selectable options |
| Privacy: data stays in browser | 08 Product UI | Header privacy popover; no network requests |
| No backend required | 09 Release | doc/RUN.md confirms no backend needed |
| 10 MB file support | 09 Release | e2e/performance.spec.ts tests 1 MB, 5 MB; fixture generator supports 10 MB |

## PRD Acceptance Criteria

| PRD Criterion | Epic Task | Passing Test |
| --- | --- | --- |
| Paste, edit, upload, clear JSON up to 10 MB | 04 Core Workspace | Editor tests, e2e upload test |
| First-visit sample JSON | 04 Core Workspace | App test "shows first-visit example" |
| Sample not reloaded after clear | 04 Core Workspace | Workspace state reducer tests |
| Supported top-level values | 01 Foundation | Domain type tests |
| Automatic validation | 03 Worker | Worker validation tests |
| Reliable errors explained | 03 Worker | Worker diagnostic tests |
| First error focused with red caret | 04 Core Workspace | InputEditor error decoration tests |
| Safe repair preview + accept | 05 Repair Experience | RepairPreviewDialog tests, e2e safe repair |
| Ambiguous choices never automatic | 05 Repair Experience | RepairFlow tests, e2e ambiguous |
| Unsupported repair → manual guidance | 05 Repair Experience | RepairManualGuidance tests, e2e unsupported |
| Original input unchanged | 05 Repair Experience | Repair safety tests (worker never mutates) |
| Beautify valid JSON | 06 Format/Convert/Schema | Processing tests, e2e beautify |
| Minify valid JSON | 06 Format/Convert/Schema | Processing tests |
| Convert to YAML/XML | 06 Format/Convert/Schema | Converter tests |
| Convert object/array to CSV | 06 Format/Convert/Schema | CSV converter tests, e2e CSV |
| Schema Check from separate drawer | 06 Format/Convert/Schema | SchemaDrawer tests, e2e schema |
| Code, tree, object views with collapse | 07 Result Views | View tests, e2e collapse |
| Copy and Download after result | 07 Result Views | ResultPanel tests, e2e copy/download |
| Disabled actions explain why | 08 Product UI | ActionDock uses DisabledReason |
| 10 MB usable | 09 Release | Performance tests |
| Desktop and mobile layout | 08 Product UI | Workspace and MobileWorkspaceTabs tests |
| Data stays inside browser | 08 Product UI | No network calls; local storage only |

## BRD Repair Safety Rules

| Safety Rule | Epic Task | Coverage |
| --- | --- | --- |
| Never add/remove/reorder/guess data | 02 Strict Repair Engine | Engine tests (safe, unsafe, ambiguous) |
| One safe meaning → preview | 05 Repair Experience | Repair flow tests |
| Multiple meanings → choices | 05 Repair Experience | Ambiguous choice tests |
| Unreliable → manual guidance | 05 Repair Experience | Manual guidance tests |
| No free-text repair | 05 Repair Experience | No free-text input in repair UI |

## Test Coverage Summary

| Suite | Tests | Coverage Area |
| --- | --- | --- |
| Unit tests (Vitest) | 434 | All domain, engine, state, hooks, components |
| E2E tests (Playwright) | 28 passed | User-flow, performance, and safety |
| Workspace tests | 9 | Workspace layout + accessibility |
| Accessibility tests | 7 | Landmarks, roles, labels, keyboard |

## Accepted Limitations

- 10 MB validation: measured passing in Playwright full run at about 2.2 s
- 10 MB repair analysis: measured passing by browser budget assertion
- Repair timing for large fixtures: 10 MB supported-invalid fixture passes budget assertion
- CSV large array: converts compact JSON in one cell (PRD spec)
- Tree view: virtualized, does not render every row
- Mobile: Input/Result tab switching without losing state
- Performance measured on Playwright headless Chromium; headed browser may differ
