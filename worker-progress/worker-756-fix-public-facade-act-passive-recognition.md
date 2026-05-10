# Worker 756: Public Facade Act/Passive Recognition

## Summary

- Updated the root-render E2E conformance gate so Worker 753's private
  `react-dom/test-utils.act` side-effect policy shape is recognized.
- Kept the recognition private-only by requiring `executesRendererWork` and
  `executesPublicFlushSync` to stay `false`, alongside the existing public act,
  root execution, passive/effect, DOM mutation, and compatibility blockers.
- Added a focused public-facade regression test that requires all 20 private
  act/passive scenario-mode rows to be admitted as private diagnostics.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-756-fix-public-facade-act-passive-recognition.md`

## Commands Run

- `node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs` - passed.
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot|public facade|private act/passive"` - passed, 28 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed, 28 tests.
- `npm run check:package-surface` - passed. npm emitted the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence

- Before the fix, `evaluateReactDomRootRenderE2EConformanceGate` rejected all
  20 private act/passive rows with
  `private-root-act-passive-act-evidence-mismatch` at
  `$.reactDomTestUtilsActGate.sideEffectPolicy.keys`.
- After the fix, the public facade gate returns `ok: true`, the private
  act/passive diagnostic row count is 20, and the blocked private act/passive
  row count is 0.
- The new focused test checks a representative private act/passive row for the
  accepted private status and verifies all public act, public test-utils act,
  public root render, public passive effect, renderer work, public flushSync,
  and scheduler-driven passive execution claims remain false.

## Risks Or Blockers

- This change only updates conformance-gate recognition. It does not admit
  public `act`, public `flushSync`, root execution, passive/effect execution,
  renderer/native execution, or public facade compatibility.
- The row recognition is intentionally exact about the side-effect policy keys,
  so future private diagnostic shape changes should update this comparator and
  regression test together.

## Recommended Next Tasks

- Keep monitoring public facade gates after React DOM root-bridge merges to
  ensure private diagnostics remain private-only blockers.
- When public `act` or passive effect execution becomes real behavior, add a
  separate gate transition instead of relaxing these private diagnostic rows.
