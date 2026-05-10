You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the Rust-only `fast-react-test-renderer` private host-output canary beyond initial create with narrow update and unmount/delete diagnostics for the one HostComponent plus HostText fixture, while keeping JS `react-test-renderer`, public serialization, `act`, DOM/native behavior, and compatibility claims blocked.

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- Minimal private helper exports in `crates/fast-react-reconciler/src/lib.rs` only if unavoidable
- `worker-progress/worker-234-test-renderer-host-output-update-unmount-canary.md`

Context to inspect:
Workers 153, 188, 195, 196, 203, 204, 205, 206, 208, and 209.

Constraints:
- You are not alone in the codebase. Workers 235-237 may edit test-renderer areas; do not revert them.
- Keep the canary private and Rust-only. Do not add JS facade behavior or public compatibility admissions.
- Prefer diagnostics and fail-closed update/unmount evidence over broad mutation traversal.

Verification:
- `cargo fmt --all --check`
- Focused `cargo test -p fast-react-test-renderer --all-features host_output`
- Full `cargo test -p fast-react-test-renderer --all-features`
- Relevant `cargo test -p fast-react-reconciler --all-features` if reconciler helpers change
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
