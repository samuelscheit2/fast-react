# Worker 704: DOM Root Update Style/Dangerous HTML Execution

Objective: add private React DOM root-update evidence that applies accepted style and `dangerouslySetInnerHTML` fake-DOM update rows through the root bridge, preserving rollback/fail-closed behavior and no public root compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `packages/react-dom/src/dom-host/property-payload.js`, `packages/react-dom/src/dom-host/mutation.js`, `packages/react-dom/src/client/root-bridge.js` only for private admission plumbing, `packages/react-dom/test/dom-property-operations-private.test.js`, focused conformance for style/dangerous HTML/root facade, and `worker-progress/worker-704-dom-root-update-style-dangerous-html-execution.md`.

Constraints: do not edit event, hydration, resource/form, controlled-input, or test-renderer files. Keep unsupported rows fail-closed.

Verification: focused DOM property/private tests, focused style/dangerousHTML conformance, root facade conformance if touched, `npm run check --workspace @fast-react/react-dom`, conflict-marker scan, and `git diff --check`.
