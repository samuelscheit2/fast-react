# Worker 1242 Repair: Package Unmount Expectations

## Summary

- Repaired stale package-level React DOM expectations for public
  `createRoot().unmount()` after unmount.
- Kept the accepted behavior narrow: repeated public `root.unmount()` returns
  `undefined`, while stale `root.render(...)` after unmount still fails closed.
- Left duplicate-root guard coverage intact in the direct
  `react-dom/client` symbol facade gate.
- No runtime behavior changed.

## Changed Files

- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
  - Changed the post-unmount repeated `createRootResult.unmount()` expectation
    from `FAST_REACT_UNIMPLEMENTED` to `undefined`.
  - Preserved the preceding stale `createRootResult.render(...)` fail-closed
    assertion and duplicate-root guard assertion.
- `packages/react-dom/test/react-dom-private-root-bridge-shell/context.js`
  - Changed the shared minimal public host-output helper's repeated
    `root.unmount()` expectation from `FAST_REACT_UNIMPLEMENTED` to
    `undefined`.
  - Preserved stale `root.render(...)` fail-closed coverage before recreation.

## Verification

- Baseline failing commands before the repair:
  - `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
    - Failed: 4 pass, 1 fail. Failure was a missing expected exception for
      repeated `createRoot().unmount`.
  - `npm --prefix packages/react-dom run check`
    - Failed: 225 pass, 12 fail in `node --test test/*.test.js`; all failures
      traced to the same stale repeated `createRoot().unmount` expectation in
      the direct gate or shared helper.
- Final commands:
  - `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
    - Passed: 5 pass, 0 fail.
  - `npm --prefix packages/react-dom run check`
    - Passed: package tests 237 pass, 0 fail; import-entrypoints smoke passed.
  - `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
    - Passed: React DOM private root bridge shell smoke checks passed.
  - `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
    - Passed: 45 pass, 0 fail.
  - `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
    - Passed: 11 pass, 0 fail.
  - `npm run check:package-surface`
    - Passed: package surface snapshot guard passed.
  - `node tests/smoke/import-entrypoints.mjs`
    - Passed: accepted inventory and entrypoint smoke checks passed.
  - `git diff --check`
    - Passed with no output.

## Risks Or Blockers

- No blockers remain for this repair.
- Risk is limited to test expectation drift: runtime already implemented
  idempotent public unmount. This patch only aligns package-level tests with
  the current accepted narrow behavior.

## Recommended Next Tasks

- Re-run the post-merge source audit from the orchestrator context after this
  repair lands, since the original blocker was verification-only.
