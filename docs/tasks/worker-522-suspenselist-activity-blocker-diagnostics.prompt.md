You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private fail-closed child-shape diagnostics for SuspenseList and Activity
fibers analogous to worker 480 Suspense/Offscreen diagnostics, without
implementing their reconciliation or public behavior.

Write scope:
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/unsupported_features.rs`
- focused Rust tests in those modules
- `worker-progress/worker-522-suspenselist-activity-blocker-diagnostics.md`

Constraints:
- Do not implement SuspenseList, Activity, ViewTransition, hydration reveal, or
  hidden subtree rendering.
- Keep diagnostics private and explicit about unsupported behavior.

Verification:
- Run focused unsupported feature/begin-work/root-work-loop tests.
- Run `cargo test -p fast-react-reconciler unsupported_feature --all-features`.
- Run `cargo fmt --all --check` and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
