# Worker 775 React Act Delayed Mock Consumer

## Summary

- Added a package-private React act delayed Scheduler mock preflight on
  `packages/react/private-act-dispatcher-gate.js`.
- The preflight accepts only Scheduler-owned delayed diagnostics as private
  context and consumes only the nested Scheduler-owned expired act/root report
  through the existing Worker 747 expired diagnostic validator.
- Top-level delayed reports remain rejected by the expired act/root consumer
  and are explicitly not accepted as public React act evidence.
- Scheduler now enrolls the delayed top-level diagnostics report in the same
  private Scheduler-owned source WeakSet used by the immutable mock flush helper
  validator, so shallow clones and old global-source forgeries reject.
- Public React act, public Scheduler/root/renderer compatibility, public queue
  drains, renderer work, queued work, and effects all remain false/blocked.
- No public package exports or package surface entries were added.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `worker-progress/worker-775-react-act-delayed-mock-consumer.md`

## Commands Run

- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check packages/scheduler/unstable_mock.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  18 tests.
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
  - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
  - passed, 3 tests.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` -
  passed, 23 tests.
- `npm run check --workspace @fast-react/react` - passed; npm printed the
  existing `minimum-release-age` warning.
- `npm run check --workspace scheduler` - passed; npm printed the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, Worker 747 and Worker 765 progress reports,
  `packages/react/private-act-dispatcher-gate.js`,
  `packages/scheduler/unstable_mock.js`,
  `tests/conformance/test/react-act-oracle.test.mjs`, and
  `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`.
- A read-only source-proof explorer confirmed React 19.2.6 public `act` uses
  private `ReactSharedInternals.actQueue` state and does not inspect Scheduler
  mock delayed/expired reports.
- A read-only local-shape explorer confirmed delayed mock diagnostics route
  through the expired act/root drain report and keep public compatibility
  claims false.
- React act coverage now proves accepted nested expired-only consumption,
  top-level delayed rejection by the expired consumer, shallow clone rejection,
  old global forged clone rejection, deep forged clone rejection, nested expired
  clone rejection, public claim rejection, and public blockers remaining false.
- Scheduler delayed coverage now proves the delayed top-level report and nested
  expired report are Scheduler source-owned while a cloned top-level delayed
  report is not.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The delayed preflight is private diagnostics only. It does not open public
  React `act`, public Scheduler timing behavior, root execution, renderer work,
  queued work, effects, or package compatibility.
- The Scheduler change is intentionally narrow: it enrolls only the delayed
  diagnostics report object in the existing private source proof set so React
  can reject cloned or forged delayed reports before using nested evidence.

## Recommended Next Tasks

- Keep public React act/root compatibility blocked until renderer roots,
  passive effects, and public act queue semantics are admitted together.
- If future delayed Scheduler mock diagnostics add new root-work evidence,
  extend this preflight only after the Scheduler-owned source graph and public
  blockers are refreshed together.
