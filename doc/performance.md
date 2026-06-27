# Rectifier v1 Performance Report

## Reference Machine

- **OS:** Linux
- **Browser:** Chromium (Playwright headless, production build)
- **Date:** 2026-06-26

## Release Performance Budgets

| Budget | Target | Status | Measured |
| --- | --- | --- | --- |
| 10 MB valid JSON validation | ≤ 5 s | Pass | 1,559 ms |
| 10 MB repair analysis | ≤ 10 s | Pass | 2,443 ms |
| UI responsiveness during processing | ≤ 250 ms | Pass | 110 ms |
| Main-thread long task caused by Rectifier | ≤ 500 ms | Pass | 72 ms after upload handoff |

## Measured Results

### Validation Time

| Fixture | Size | Time | Pass/Fail |
| --- | --- | --- | --- |
| 1 MB valid array | ~1,048,576 B | Passed browser assertion | Pass |
| 5 MB valid array | ~5,242,880 B | Passed browser assertion | Pass |
| 10 MB valid array | <= 10,485,760 B | 1,559 ms | Pass |

### Repair Analysis Time

| Fixture | Size | Time | Pass/Fail |
| --- | --- | --- | --- |
| 10 MB supported-invalid | <= 10,485,760 B | 2,443 ms | Pass |

### Responsiveness

| Test | Target | Measured | Status |
| --- | --- | --- | --- |
| UI interactive during worker processing | 250 ms | 110 ms | Pass |

### Memory

| Fixture | Peak JS Heap | Status |
| --- | --- | --- |
| 10 MB valid | 142,758,736 B used JS heap | Recorded |

## How to Run

```bash
# Production build
npm run build

# Start preview server and run performance tests
npx playwright test e2e/performance.spec.ts
```

Measured times are printed by the Playwright reporter.

## Known Limitations

- Playwright headless may differ from headed browser performance.
- 1 MB, 5 MB, and 10 MB valid validation complete on this machine.
- 10 MB supported-invalid repair analysis passes the browser budget assertion.
- Memory measurement is advisory; exact heap values depend on GC timing.
- Worker processing time depends on CPU speed and available memory.
- Main-thread long-task measurement starts after browser upload handoff, so the
  number reflects Rectifier processing rather than Playwright file injection.
