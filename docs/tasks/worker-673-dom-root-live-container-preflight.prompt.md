# Worker 673: DOM Root Live Container Preflight

Objective: add a private React DOM root preflight that accepts a DOM-like live container only as blocked evidence, proving marker/listener/DOM writes remain disabled before real browser mutation.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `packages/react-dom/src/client/root-bridge.js`, `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`, root facade conformance tests, and `worker-progress/worker-673-dom-root-live-container-preflight.md`.

Keep fake-DOM render/update/unmount execution unchanged and do not claim public `createRoot` compatibility.

Verification: `node --check packages/react-dom/src/client/root-bridge.js`, focused `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`, focused root-facade conformance tests, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
