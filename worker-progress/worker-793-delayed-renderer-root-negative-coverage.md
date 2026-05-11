# Worker 793 - Delayed Renderer Root Negative Coverage

## Summary

- Added focused conformance coverage for delayed renderer-root producer
  rejection paths in
  `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`.
- Covered renderer-root public/package compatibility claims, public Scheduler
  flush claims, effects/root execution claims, and
  `privateActRootHandoffOnly: false`.
- Covered mismatched renderer-root promotion options for scheduled virtual
  time, delay, start time, expiration time, and priority timeout.
- Covered post-production root request metadata mutation before renderer-root
  handoff and after delayed act/root metadata production.
- Added positive-path assertions that renderer-root delayed handoff reports
  keep public timing, public flush helpers, React act/root compatibility,
  renderer/effects execution, and compatibility claims blocked.

## Changed Files

- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `worker-progress/worker-793-delayed-renderer-root-negative-coverage.md`

## Commands Run

- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace scheduler`
- `git diff --check`

## Evidence Gathered

- Focused delayed act/root conformance file passed: 6 tests, 6 pass.
- Scheduler delayed/expired/mock oracle group passed: 32 tests, 32 pass.
- Package surface guard passed.
- Import entrypoint smoke passed.
- Scheduler workspace check passed.
- Diff whitespace check passed.

## Risks Or Blockers

- No source changes were needed; existing private validators already rejected
  the new negative cases.
- Root request metadata mutation uses mutable request-field payloads because
  produced metadata objects are frozen; this specifically verifies the source
  signature validator rejects post-production nested value mutation.
- Merge risk is limited to
  `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`,
  which is likely shared with nearby Scheduler workers.

## Recommended Next Tasks

- Re-run the same scheduler delayed/expired/mock oracle group after merging
  with other Scheduler worker branches.
