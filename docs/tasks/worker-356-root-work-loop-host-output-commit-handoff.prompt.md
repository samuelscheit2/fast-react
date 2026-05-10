# Worker 356: Root Work Loop Host Output Commit Handoff

Objective: connect the private root work-loop complete-work handoff to the
accepted HostRoot commit handoff for a minimal HostComponent/HostText tree,
returning explicit diagnostics while keeping public render blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 129, 149, 151, 323, 324, 350, 351, and
352 if present.

Write scope: `crates/fast-react-reconciler/src/root_work_loop.rs`,
`crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_work.rs`, focused Rust tests, and
`worker-progress/worker-356-root-work-loop-host-output-commit-handoff.md`.

Do not add public renderer entrypoints or broad child reconciliation.

Verification: run `cargo fmt --all --check`, focused root-work-loop/root-commit
tests, `cargo test -p fast-react-reconciler --all-features`, and
`git diff --check`.
