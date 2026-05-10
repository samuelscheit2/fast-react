# Worker 384: Root Commit HostComponent Deletion Apply

Objective: add a private root-commit canary that applies HostComponent subtree
deletion cleanup through accepted host token and fake host records, including
component-tree/ref cleanup evidence, without public renderer behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 206, 263, 355, 369, and 371 if
present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`,
`crates/fast-react-reconciler/src/host_nodes.rs`, focused reconciler tests, and
`worker-progress/worker-384-root-commit-host-component-deletion-apply.md`.

Do not implement public unmount compatibility, passive effects, browser DOM, or
renderer-specific behavior.

Verification: run `cargo fmt --all --check`, focused `root_commit`,
`host_work`, and `host_nodes` tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
