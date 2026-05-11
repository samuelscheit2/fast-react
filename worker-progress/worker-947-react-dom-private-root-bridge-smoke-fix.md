# Worker 947: React DOM Private Root Bridge Smoke Fix

## Summary

Fixed the private React DOM unmount host-output cleanup path after an accepted
host-output update. The cleanup validator now distinguishes a stale replaced
create/render admission from the same current admission whose render count
advanced through a source-owned latest host-output update.

## Root Cause

`cleanupUnmountHostOutput(admission, unmount)` rejected the smoke path because
the initial create/render admission had `renderCount === 1`, while the later
accepted `applyHostOutputUpdate` render advanced the handle and unmount record
to `renderCount === 2`. The validator treated any render-count mismatch as
stale admission metadata even when the admission was still the handle's current
create/render admission and the latest fake-DOM output was current.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
  - Tracks the latest accepted private host-output update record on the root
    handle state.
  - Allows unmount cleanup after render-count advancement only when the latest
    update is source-owned, belongs to the same root handle/bridge, targets an
    active initial host-output node/token from the admitted render, and occurs
    between the admitted render and unmount request.
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - Added regression coverage for successful cleanup after a current
    host-output update.
  - Added a negative check proving a later unapplied render remains rejected as
    stale cleanup evidence.
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
  - Refreshed the unmount cleanup accepted capability expectation to match the
    current cleanup record surface.

## Commands Run

- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- The original smoke failure reproduced as
  `FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD` with message
  `Private unmount host-output cleanup rejects stale root handle admission metadata.`
- Focused React DOM root bridge tests pass with 73/73 tests.
- React DOM workspace check passes with 223/223 tests plus import smoke.
- Package surface guard and import-entrypoint smoke pass.

## Risks Or Blockers

- The fix intentionally does not admit arbitrary render-count advancement. It
  only accepts the latest tracked host-output update when tied back to the
  active initial host-output payload for the same private admission.
- Public roots, native execution, reconciler execution, browser DOM
  compatibility, events, and compatibility claims remain blocked.

## Recommended Next Tasks

- Re-run the same React DOM root bridge smoke after merging nearby Worker 910 or
  Worker 944 changes if they alter root bridge currentness fields.
