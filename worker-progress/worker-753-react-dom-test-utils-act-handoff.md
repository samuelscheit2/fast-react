# Worker 753: React DOM Test-Utils Act Handoff

## Summary

- Added private React DOM `test-utils.act` gate evidence that consumes Worker
  694 nested sync-flush/act root continuation evidence and Worker 718
  sync-flush/root-scheduler `finished_work` / `finished_lanes` handoff
  evidence.
- Kept the public `react-dom/test-utils.act` route closed: public React act,
  public React DOM `flushSync`, public root execution, passive/effect
  execution, renderer work, native bridge execution, and compatibility claims
  remain blocked.
- Added fail-closed gate validation for missing prerequisite IDs, stale Worker
  694/718 evidence, and accepted private prerequisites that try to claim public
  compatibility.
- Updated the act/passive local gate to include the new private prerequisite IDs
  and to reject React DOM test-utils act side-effect policy claims for renderer
  work or public flushSync.

## Changed Files

- `packages/react-dom/src/test-utils-act-gate.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `tests/conformance/src/act-passive-local-gate.mjs`
- `tests/conformance/test/act-passive-local-gate.test.mjs`
- `worker-progress/worker-753-react-dom-test-utils-act-handoff.md`

## Commands Run

- `node --check packages/react-dom/src/test-utils-act-gate.js` - passed.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` - passed, 13 tests.
- `node --test tests/conformance/test/act-passive-local-gate.test.mjs` - passed, 6 tests.
- `npm run check --workspace @fast-react/react-dom` - passed, 157 package tests plus import smoke. npm emitted the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed. npm emitted the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Worker 694 evidence records nested act continuation ordering, pending-lane
  before/after state, lane preservation, and public act/flushSync blockers.
- Worker 718 evidence records private sync-flush/root-scheduler continuation
  commits through `finished_work` and `finished_lanes`, with missing, stale, and
  foreign handoff rejection.
- The React DOM test-utils act gate now exposes a private
  `react-dom-test-utils-act-private-sync-flush-root-handoff-gate-1` diagnostic
  and requires both Worker 694 and Worker 718 prerequisite records to remain
  fresh and non-public.
- Conformance now proves the gate rejects removed prerequisite IDs, stale Worker
  694 evidence, and public compatibility claims on accepted private
  prerequisites.

## Risks Or Blockers

- This is diagnostic metadata only. It does not make public `act`, `flushSync`,
  root render/update/unmount, effects, renderer work, or native bridge execution
  available.
- The new gate consumes worker-progress/Rust evidence by static prerequisite
  records; real public behavior still needs separate facade and renderer
  execution gates.

## Recommended Next Tasks

- Keep public `react-dom/test-utils.act` blocked until public React act
  delegation, public React DOM root execution, public `flushSync`, passive
  effect draining, and warning compatibility are proven together.
- When a future public/facade gate consumes these diagnostics, preserve the
  missing/stale/public-claim rejection checks before admitting any public
  compatibility surface.
