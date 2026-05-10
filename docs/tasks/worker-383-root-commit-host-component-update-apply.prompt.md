# Worker 383: Root Commit HostComponent Update Apply

Objective: add a private root-commit canary that applies an admitted
HostComponent property/text update payload through the fake host config while
keeping public renderer compatibility blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 263, 337, 353, 356, 357, 367, and 368
if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`, focused reconciler tests, and
`worker-progress/worker-383-root-commit-host-component-update-apply.md`.

Do not wire public DOM or test-renderer compatibility; keep the new path
private, fake-host-only, and explicitly diagnostic.

Verification: run `cargo fmt --all --check`, focused `root_commit` and
`host_work` tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
