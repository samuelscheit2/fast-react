# Worker 410: Root Render E2E Private flushSync Admission

Objective: add private scheduling/flush evidence for the
`flush-sync-cross-root-render` root-render E2E scenario and admit only the
private diagnostic rows that are explicitly proven.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 177, 179, 285, 331, 357, 380, and 381
if present.

Write scope: `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`,
`tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`,
`crates/fast-react-reconciler/src/sync_flush.rs`, focused root-render and
sync-flush tests, and
`worker-progress/worker-410-root-render-e2e-private-flushsync-admission.md`.

Keep public root-render compatibility, public flushSync behavior, and browser
DOM compatibility blocked.

Verification: run `cargo fmt --all --check`, focused sync-flush tests, root
E2E oracle tests,
`npm run root-render-e2e:conformance --workspace @fast-react/conformance`, and
`git diff --check`.
