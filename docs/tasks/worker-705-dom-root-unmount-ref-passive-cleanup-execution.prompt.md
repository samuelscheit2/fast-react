# Worker 705: DOM Root Unmount Ref/Passive Cleanup Execution

Objective: add private React DOM root-unmount evidence that consumes accepted ref cleanup and passive destroy ordering metadata for fake-DOM cleanup, while public root unmount and passive behavior remain blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `packages/react-dom/src/client/root-bridge.js`, `packages/react-dom/src/client/ref-callback-gate.js`, `packages/react-dom/src/test-utils-act-gate.js` only if private passive blockers are consumed, focused React DOM tests/conformance, and `worker-progress/worker-705-dom-root-unmount-ref-passive-cleanup-execution.md`.

Constraints: do not edit event dispatch, hydration, resource/form, controlled input, or test-renderer files. Do not claim public unmount compatibility.

Verification: focused React DOM root bridge/ref tests, focused root facade and ref-callback conformance, `npm run check --workspace @fast-react/react-dom`, conflict-marker scan, and `git diff --check`.
