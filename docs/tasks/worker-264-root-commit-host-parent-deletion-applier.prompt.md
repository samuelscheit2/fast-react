You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private HostRoot deletion applier canary for host-parent child removals below HostComponent, using accepted deletion-list metadata and host-node store validation, without deletion traversal cleanup, ref detach execution, passive cleanup, public renderer output, DOM behavior, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `worker-progress/worker-264-root-commit-host-parent-deletion-applier.md`

Context to inspect:
Workers 187, 198, 205, 206, 226, 233, 234.

Constraints:
- Apply only cases where parent and child host handles are already safely available.
- Keep unsupported deletions recorded-only and fail closed.
- Do not widen commit traversal.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features host_work`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
