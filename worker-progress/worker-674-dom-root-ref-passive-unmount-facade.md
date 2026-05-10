# Worker 674: DOM Root Ref Passive Unmount Facade

Goal status from `get_goal`: active

Goal objective: connect private React DOM root facade `root.unmount()` cleanup metadata to accepted ref detach/passive destroy evidence for one fake-DOM host tree, without public root unmount compatibility.

## Changes

- Added conditional private facade `root.unmount()` ref/passive evidence in `packages/react-dom/src/client/root-bridge.js`.
- The new evidence is emitted only when the private fake element includes both a host `ref` and `privatePassiveDestroy`; existing plain unmount cleanup diagnostics keep their prior accepted/blocked capability sets.
- The new diagnostic admits one deleted-ref detach metadata record and metadata-only passive destroy evidence before fake-DOM host cleanup.
- Public root unmount, public ref callback/object-ref behavior, scheduler-driven passive execution, and compatibility claims remain blocked.
- Added focused shell coverage in `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`.
- Added root-render E2E conformance coverage and a worker-674 private React DOM metadata admission row.

## Verification

- Passed: `node --check packages/react-dom/src/client/root-bridge.js`
- Passed: `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- Passed: `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- Passed: `node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- Passed: `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- Passed: `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- Passed: `npm run check --workspace @fast-react/react-dom`
- Passed: `git diff --check`
