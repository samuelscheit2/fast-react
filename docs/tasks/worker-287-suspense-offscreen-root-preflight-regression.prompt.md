You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add regression coverage for Suspense, Offscreen, Activity, ViewTransition, Fragment, and Portal root-work-loop preflight after accepted single-child and context handoffs, proving each unsupported tag still fails closed without scheduling children, host mutation, hydration, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/unsupported_features.rs` if needed
- `worker-progress/worker-287-suspense-offscreen-root-preflight-regression.md`

Context to inspect:
Workers 175, 227, 243, 247, 249, 262.

Constraints:
- Tests/gates only unless a bug is found.
- Do not implement Suspense/Offscreen/Portal.
- Preserve existing portal diagnostics.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-core --all-features fiber`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
