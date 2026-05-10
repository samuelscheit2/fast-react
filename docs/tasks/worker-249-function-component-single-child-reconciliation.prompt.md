You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private function-component single-child reconciliation canary that turns one supported function output into a HostComponent or HostText child handoff for existing root work-loop complete-work paths, without general arrays, keys, fragments, portals, Suspense, effects, DOM/test-renderer public output, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Focused reconciler tests
- `worker-progress/worker-249-function-component-single-child-reconciliation.md`

Context to inspect:
Workers 159, 194, 199, 200, 203, 222, 223, 224, 247.

Constraints:
- You are not alone in the codebase. Keep this to one-child canary behavior and document any overlap.
- Do not implement list reconciliation, keyed diffing, fragments, or portals.
- Preserve fail-closed unsupported child behavior.

Verification:
- `cargo fmt --all --check`
- Focused function_component/begin_work/root_work_loop tests
- Full `cargo test -p fast-react-reconciler --all-features`
- Reconciler clippy with warnings denied
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
