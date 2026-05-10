# Worker 413: Root Commit HostComponent Update Traversal Canary

Objective: extend the private root commit HostComponent update apply canary from
the current narrow rows into a depth-limited traversal that can consume ordered
HostComponent update records produced below a committed HostRoot.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 263, 293, 353, 383, and 396 if present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, focused root
commit tests, any minimal host-config/test helpers needed by those tests, and
`worker-progress/worker-413-root-commit-host-component-update-traversal.md`.

Do not touch deletion cleanup, refs, passive effects, React DOM JS gates, or
public compatibility claims.

Verification: run `cargo fmt --all --check`, focused root commit update tests,
`cargo test -p fast-react-reconciler --all-features`, and `git diff --check`.
