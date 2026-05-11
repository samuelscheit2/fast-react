# Worker 822 React DOM Test Utils Act Negative Matrix

## Summary

- Added a React DOM test-utils act private prerequisite for the accepted Worker
  810 React act/Scheduler diagnostics ledger shape.
- The DOM gate now records the ledger as static, source-token-only,
  manifest-only private evidence and keeps public React act, test-utils act,
  root execution, effects, Scheduler timing/flush behavior, renderer work, and
  package compatibility blocked.
- Added DOM-focused stale/foreign/tampered negative coverage for Worker
  810-style ledger metadata. Tampered nested public blocker claims are reported
  as private prerequisite public claims and cannot flip the top-level public act
  gate or side-effect policy.
- Updated adjacent React DOM act oracle assertions, including the React-act
  conformance test section that hard-codes the React DOM private prerequisite
  manifest.
- Audit follow-up validates the duplicated nested `summary` representation of
  the Worker 810 ledger prerequisite, including nested `summary.publicBlockerClaims`.
  Nested summary worker-id, public execution, and public blocker-claim tampering
  now fail closed.

## Changed Files

- `packages/react-dom/src/test-utils-act-gate.js`
- `packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-822-react-dom-test-utils-act-negative-matrix.md`

## Commands Run

- `node --check packages/react-dom/src/test-utils-act-gate.js` - passed.
- `node --check packages/react-dom/test/react-dom-test-utils-act-gate.test.js` - passed.
- `node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js` - passed, 4 tests.
- `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed, 25 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 69 tests.
- `npm run check --workspace @fast-react/react-dom` - passed, 182 package tests plus import smoke; npm printed the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- Audit follow-up: `node --check packages/react-dom/src/test-utils-act-gate.js` - passed.
- Audit follow-up: `node --check packages/react-dom/test/react-dom-test-utils-act-gate.test.js` - passed.
- Audit follow-up: `node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed.
- Audit follow-up: `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- Audit follow-up: `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js` - passed, 4 tests.
- Audit follow-up: `node --test tests/conformance/test/private-admission-810-react-act-scheduler-diagnostics-ledger.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed, 25 tests.
- Audit follow-up: `node --test tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 69 tests.
- Audit follow-up: `npm run check --workspace @fast-react/react-dom` - passed, 182 package tests plus import smoke; npm printed the existing `minimum-release-age` warning.
- Audit follow-up: `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- Audit follow-up: `node tests/smoke/import-entrypoints.mjs` - passed.
- Audit follow-up: `git diff --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md` and
  `worker-progress/worker-810-react-act-scheduler-diagnostics-ledger.md`.
- Inspected Worker 810's accepted ledger in
  `tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs`.
- Inspected the React DOM test-utils act gate and tests, the React DOM act
  oracle test, and adjacent React act/Scheduler conformance slices.
- Confirmed the DOM gate's Worker 810 ledger worker IDs, evidence kinds, and
  delayed renderer-root scopes match the accepted Worker 810 module in the new
  focused test.
- Confirmed stale status/requirements, foreign worker manifest, and tampered
  public readiness/execution/Scheduler flush claims all produce fail-closed
  private prerequisite violations while public act/test-utils act readiness and
  side-effect execution remain false.
- Confirmed package surface and import smokes still pass, so no new public
  entrypoints or package exports were exposed.
- Audit follow-up confirmed a nested `summary.workerId` foreign worker,
  `summary.publicActExecution: true`, and
  `summary.publicBlockerClaims.publicActExecution: true` each produce
  fail-closed Worker 810 prerequisite violations and do not open public
  test-utils act readiness or side-effect execution.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The React DOM gate duplicates a static summary of the Worker 810 ledger shape
  because the runtime package is CommonJS and should not load the conformance
  ESM ledger at runtime. The focused test compares the summary to the accepted
  ledger constants to catch drift.
- Merge overlap risk remains in React act/Scheduler and React DOM act oracle
  tests because adjacent workers may touch the same private diagnostic
  manifests.

## Recommended Next Tasks

- Re-run the focused React DOM act gate test and adjacent React act/Scheduler
  conformance slice after merging branches that modify Worker 810 ledger
  constants or React act/Scheduler private diagnostics.
- Keep public React act, React DOM test-utils act, public root execution,
  effects, renderer execution, Scheduler public timing/flush behavior, and
  package compatibility blocked until a separate public-behavior admission
  proves those surfaces together.
