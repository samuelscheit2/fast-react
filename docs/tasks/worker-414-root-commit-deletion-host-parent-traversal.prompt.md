# Worker 414: Root Commit Deletion Host Parent Traversal Canary

Objective: add a private deletion traversal canary that validates nearest host
parent lookup for HostComponent/HostText deletion cleanup beneath HostRoot,
including ordering evidence, without broad fragment/portal support.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 264, 295, 355, 384, and 402 if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, focused deletion
cleanup tests, any minimal reconciler test helpers required by those tests, and
`worker-progress/worker-414-root-commit-deletion-host-parent-traversal.md`.

Do not modify React DOM portal gates, ref callbacks, passive effects, or public
root behavior.

Verification: run `cargo fmt --all --check`, focused deletion/root commit tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
