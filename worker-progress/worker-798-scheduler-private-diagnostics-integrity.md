# Worker 798 - Scheduler Private Diagnostics Integrity

## Summary

- Hardened Scheduler mock private diagnostics so public/package/helper flush
  compatibility claims are rejected on expired lane metadata, expired act/root
  metadata, delayed act/root metadata, renderer-root producer metadata,
  internal act queues/tasks/callbacks, and root work records.
- Added conformance coverage proving the expired act/root source validator is
  only reachable through the frozen private diagnostics object and is not
  exposed as direct public flush-helper keys or symbol descriptors.
- Added forged-source coverage for cloned diagnostics objects, fake validators,
  old global proof tokens, and helper-symbol aliases.
- Preserved accepted private React act handoff behavior for expired and delayed
  renderer-root routes while keeping public Scheduler timing/flush compatibility
  claims blocked.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`

## Commands Run

- `node --check packages/scheduler/unstable_mock.js`
- `node --check tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `git diff --check`

## Evidence Gathered

- Focused Scheduler mock, delayed act/root, expired lane, and native-entry tests
  pass with the new integrity assertions.
- Scheduler workspace check passes through `tests/smoke/import-entrypoints.mjs`.
- Package surface guard and import smoke pass.
- React act oracle passes, covering accepted private React act consumption and
  delayed renderer-root preflight behavior after the Scheduler validator
  tightening.
- `git diff --check` reports no whitespace errors.

## Risks Or Blockers

- No blockers.
- Merge risk: `packages/scheduler/unstable_mock.js` overlaps with active
  Scheduler/React act diagnostics work. The source changes are intentionally
  narrow but do tighten public/package/helper claim rejection for several
  private metadata shapes.

## Recommended Next Tasks

- When merging with other Scheduler or React act workers, re-run the focused
  Scheduler tests and `tests/conformance/test/react-act-oracle.test.mjs` after
  conflict resolution.
