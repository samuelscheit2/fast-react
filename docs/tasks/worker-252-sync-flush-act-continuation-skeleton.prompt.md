You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private sync-flush/act continuation skeleton that records continuation and nested-act boundaries after accepted sync flush commit handoff, without public `act`, task execution, Scheduler package behavior, DOM/test-renderer output, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- Focused reconciler tests
- `worker-progress/worker-252-sync-flush-act-continuation-skeleton.md`

Context to inspect:
Workers 097, 150, 176, 179, 191, 196, 207, 228, 253.

Constraints:
- You are not alone in the codebase. Keep this private and data-only.
- Do not change public React `act` or scheduler package files.
- Preserve execution-context guards.

Verification:
- `cargo fmt --all --check`
- Focused sync_flush/root_scheduler/scheduler_bridge tests
- Full `cargo test -p fast-react-reconciler --all-features`
- Reconciler clippy with warnings denied
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
