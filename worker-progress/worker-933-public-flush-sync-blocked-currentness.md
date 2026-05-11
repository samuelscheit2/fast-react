# Worker 933 Progress

## Summary

- Added a private, source-owned public `ReactDOM.flushSync` blocked-currentness
  report and consumer in `packages/react-dom/src/shared/flush-sync-guard.js`.
- The report observes both `react-dom` and `react-dom/profiling` public
  `flushSync` placeholders and records that callbacks are not invoked, thenable
  and return-value compatibility are not claimed, and public root/Scheduler/act
  timing paths remain blocked.
- The private consumer is fail-closed through a WeakSet source proof and rejects
  cloned reports, public/package/profiling compatibility claims, callback
  execution, thenable/return compatibility claims, Scheduler/root/private
  prerequisite smuggling, Worker 910 evidence, future-worker evidence, and
  forged non-boolean claims.
- Public `react-dom` and `react-dom/profiling` exports were not changed.
- Audit fix: nested private prerequisite rows are now validated against the
  exact canonical frozen prerequisite tree, including all own keys and all
  nested row values. Consumption returns a recomputed canonical
  `privatePrerequisites` record instead of returning caller-provided nested rows.

## Changed Files

- `packages/react-dom/src/shared/flush-sync-guard.js`
- `packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- `worker-progress/worker-933-public-flush-sync-blocked-currentness.md`

## Evidence Gathered

- Currentness path:
  `createPublicReactDomFlushSyncBlockedCurrentnessReport()` ->
  `consumePublicReactDomFlushSyncBlockedCurrentnessReport(report)`.
- Stricter nested prerequisite validation path:
  `validatePublicReactDomFlushSyncBlockedCurrentnessReport(report)` ->
  `isAcceptedPublicFlushSyncBlockedCurrentnessPrivatePrerequisites(...)` ->
  `sameFrozenValue(actual, createPublicFlushSyncBlockedCurrentnessPrivatePrerequisites())`.
- Currentness status:
  `blocked-public-react-dom-flush-sync-unsupported-placeholder-currentness`.
- Consumption status:
  `accepted-blocked-public-react-dom-flush-sync-currentness`.
- Observed public entrypoints: `react-dom` and `react-dom/profiling`.
- Accepted private context consumed only as blocked evidence:
  `worker-694-sync-flush-nested-act-root-continuation`,
  `worker-718-sync-flush-root-scheduler-finished-work-handoff`, and
  `worker-901-react-dom-render-lifecycle-boundary-consumer`.
- Excluded evidence remains explicit:
  `worker-910-hydration-recoverable-error-boundary-admission`.
- Regression probes reject forged nested private rows with `evidenceFresh:
  false`, `publicRootStillBlocked: false`, `consumesWorker910Evidence: true`,
  `executesPublicDomMutation: true`, and string-valued
  public/package/profiling compatibility claims.

## Checks

- `node --check packages/react-dom/src/shared/flush-sync-guard.js` - passed.
- `node --check packages/react-dom/test/react-dom-flush-sync-guard.test.js` -
  passed.
- `node --check packages/react-dom/index.js` - passed.
- `node --check packages/react-dom/profiling.js` - passed.
- `node --test packages/react-dom/test/react-dom-flush-sync-guard.test.js` -
  passed.
- `node --test tests/conformance/test/react-dom-flush-sync-private-guard.test.mjs` -
  passed.
- `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs` -
  passed.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` -
  passed.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` -
  passed.
- `npm run check --workspace @fast-react/react-dom` - passed. npm emitted the
  existing unsupported `minimum-release-age` config warning.
- `npm run check:package-surface` - passed. npm emitted the existing
  unsupported `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Blockers Preserved

- Public `ReactDOM.flushSync` and `react-dom/profiling.flushSync` remain
  unsupported placeholders.
- Public `flushSync` callbacks are not invoked.
- Public root execution, public Scheduler queue draining, public act/test-utils
  routing, public DOM mutation, passive effects, and package/profiling
  compatibility claims remain false.
- Accepted private sync-flush/root lifecycle evidence is recorded only as a
  blocked prerequisite and cannot open public callback execution.

## Risks Or Blockers

- The gate is intentionally private and verbose because it mirrors existing
  fail-closed currentness patterns. It does not add a public package key.
- Worker 910 hydration evidence remains excluded and was not consumed.
- No blockers remain for this worker branch.

## Recommended Next Tasks

- Keep public `flushSync` admission blocked until public roots, Scheduler
  timing, act/test-utils routing, effects, and DOM mutation semantics are proven
  together.
- If later workers add public root execution, update this gate only through a
  new source-owned report version that proves callback execution semantics and
  package/profiling compatibility explicitly.
