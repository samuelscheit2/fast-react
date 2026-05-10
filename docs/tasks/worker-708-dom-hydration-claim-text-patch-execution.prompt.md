# Worker 708: DOM Hydration Claim Text Patch Execution

Objective: add private React DOM hydration evidence for claiming a fake text node and applying an admitted mismatch recovery patch, without enabling public `hydrateRoot` behavior.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `packages/react-dom/src/client/hydration-boundary-gate.js`, `packages/react-dom/src/client/hydration-marker-parser.js`, `packages/react-dom/test/hydration-private.test.js`, focused hydration/root facade conformance, and `worker-progress/worker-708-dom-hydration-claim-text-patch-execution.md`.

Constraints: do not edit event replay, resource/form, controlled restore, root render, or test-renderer files. Keep recovery private and fake-DOM-only.

Verification: focused hydration private tests, focused hydration/root facade conformance, `npm run check --workspace @fast-react/react-dom`, conflict-marker scan, and `git diff --check`.
