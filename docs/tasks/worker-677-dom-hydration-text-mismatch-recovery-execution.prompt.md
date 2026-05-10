# Worker 677: DOM Hydration Text Mismatch Recovery Execution

Objective: advance private hydration text mismatch handling to a recoverable-error routing execution gate that consumes accepted boundary metadata without public hydration compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`, hydration tests under `packages/react-dom/test/` and `tests/conformance/test/`, and `worker-progress/worker-677-dom-hydration-text-mismatch-recovery-execution.md`.

Do not broaden event replay, resource loading, or public `hydrateRoot`.

Verification: hydration syntax checks, focused hydration package tests, `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`, `npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
