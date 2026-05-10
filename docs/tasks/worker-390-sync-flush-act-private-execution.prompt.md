# Worker 390: Sync Flush Act Private Execution

Objective: add a private sync-flush/act execution diagnostic that drains only
accepted internal act continuation records after a committed host-output canary,
without public `act` compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 176, 285, 331, 357, 366, 377, and 382
if present.

Write scope: `crates/fast-react-reconciler/src/sync_flush.rs`,
`crates/fast-react-reconciler/src/root_scheduler.rs`,
`packages/react/private-act-dispatcher-gate.js`, focused Rust/JS act tests, and
`worker-progress/worker-390-sync-flush-act-private-execution.md`.

Do not open public `React.act`, React DOM test-utils `act`, Scheduler timing,
or public renderer compatibility.

Verification: run `cargo fmt --all --check`, focused sync-flush/root-scheduler
tests, `node --test tests/conformance/test/react-act-oracle.test.mjs`,
`npm run check:js`, and `git diff --check`.
