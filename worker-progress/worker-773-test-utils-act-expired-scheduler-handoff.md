# Worker 773 Test Utils Act Expired Scheduler Handoff

## Summary

- Added a private React DOM `test-utils.act` route for Worker 747's accepted
  Scheduler mock expired act/root diagnostics.
- The route delegates validation and source-proof checks to
  `packages/react/private-act-dispatcher-gate.js`, so only Scheduler-owned,
  frozen, branded diagnostics accepted by React's private act gate can pass.
- Kept public `react-dom/test-utils.act`, public React act delegation, public
  root execution, public Scheduler flushing, passive effect execution, and
  renderer execution blocked.
- Added conformance coverage for accepted private consumption, public act
  callback non-execution, cloned/forged diagnostic rejection, public claim
  rejection, and passive/renderer execution blockers.

## Changed Files

- `packages/react-dom/src/test-utils-act-gate.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/test/act-passive-local-gate.test.mjs`
- `worker-progress/worker-773-test-utils-act-expired-scheduler-handoff.md`

## Commands Run

- `node --check packages/react-dom/src/test-utils-act-gate.js` - passed.
- `node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --check tests/conformance/test/act-passive-local-gate.test.mjs` - passed.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed, 14 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed, 17 tests.
- `node --test tests/conformance/test/act-passive-local-gate.test.mjs` - passed, 6 tests.
- `npm run check --workspace @fast-react/react-dom` - passed, 164 package tests plus import smoke; npm printed the existing `minimum-release-age` warning.
- `npm run check --workspace @fast-react/react` - passed import smoke; npm printed the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `ORCHESTRATOR.md`, Worker 747's progress report,
  and Worker 753's React DOM test-utils act handoff.
- Inspected React's private act Scheduler mock expired act/root consumer and
  Scheduler mock's source validator path before adding the React DOM route.
- Confirmed cloned top-level diagnostics, missing-brand diagnostics, old global
  source-proof forged deep clones, cloned act queue drain reports, and public
  act compatibility claims reject through the React DOM private route.
- Confirmed public `react-dom/test-utils.act` remains a placeholder and does
  not invoke a callback that attempts to consume the accepted private report.

## Risks Or Blockers

- No blocker remains in this worker scope.
- The new React DOM route is private diagnostic metadata only. It does not make
  public act, public root execution, public Scheduler timing, passive effect
  execution, or renderer execution compatible.
- The React DOM consumer intentionally depends on React's current private
  Scheduler mock expired act/root diagnostic shape and Scheduler-owned source
  proof. Future changes to Worker 747's diagnostic contract should update both
  gates and their focused conformance tests together.

## Recommended Next Tasks

- Keep public `react-dom/test-utils.act` blocked until public React act
  delegation, public React DOM roots, public `flushSync`, passive drains, and
  warning behavior are admitted together.
- If future work promotes real root execution, preserve the current cloned and
  forged diagnostic rejection tests as private route invariants.
