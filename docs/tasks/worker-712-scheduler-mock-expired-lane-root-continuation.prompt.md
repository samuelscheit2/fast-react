# Worker 712: Scheduler Mock Expired Lane Root Continuation

Objective: add private Scheduler mock evidence that expired callbacks carrying accepted lane/root metadata flush through the private root continuation handoff in deterministic order, with public mock helper compatibility still scoped.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `packages/scheduler/cjs/scheduler-unstable_mock.development.js`, `packages/scheduler/cjs/scheduler-unstable_mock.production.js` only if parity is required, scheduler-focused conformance tests, and `worker-progress/worker-712-scheduler-mock-expired-lane-root-continuation.md`.

Constraints: do not edit reconciler Rust, React DOM, or test-renderer files. Keep private helpers off public package surfaces.

Verification: focused scheduler mock conformance, `npm run check --workspace scheduler`, `npm run check:package-surface` if exports/surface change, conflict-marker scan, and `git diff --check`.
