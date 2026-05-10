# Worker 674: DOM Root Ref Passive Unmount Facade

Objective: connect private React DOM root facade `root.unmount()` cleanup metadata to accepted ref detach/passive destroy evidence for one fake-DOM host tree, without public root unmount compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `packages/react-dom/src/client/root-bridge.js`, `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`, root-render E2E conformance tests, and `worker-progress/worker-674-dom-root-ref-passive-unmount-facade.md`.

Avoid controlled input, hydration, resources, and form-action files.

Verification: `node --check packages/react-dom/src/client/root-bridge.js`, focused root bridge tests, `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
