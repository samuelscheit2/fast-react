# Worker 682: DOM Form Action Callback Preflight

Objective: add a private form action callback/action invocation preflight that consumes accepted submit dispatch/reset metadata but proves callbacks and actions remain uninvoked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `packages/react-dom/src/shared/form-actions.js`, `packages/react-dom/test/resource-form-unsupported-gates.test.js`, `tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`, form-action conformance tests, and `worker-progress/worker-682-dom-form-action-callback-preflight.md`.

Do not implement real SyntheticEvent, FormData construction, host transition, or form reset execution.

Verification: syntax checks, focused form-action package tests, `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
