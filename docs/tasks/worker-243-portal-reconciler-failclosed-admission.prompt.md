You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private reconciler fail-closed portal admission boundary: recognize portal records at the point they would enter fiber/root work and return structured unsupported diagnostics without scheduling portal children, mounting containers, installing listeners, or claiming portal render compatibility.

Write scope:
- `crates/fast-react-core/src/element.rs` only if additional portal diagnostics are needed
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Focused reconciler portal tests
- `worker-progress/worker-243-portal-reconciler-failclosed-admission.md`

Context to inspect:
Workers 057, 181, 189, 194, 199, 217.

Constraints:
- You are not alone in the codebase. Keep this fail-closed; do not implement portal fibers or commit behavior.
- Do not edit React DOM `createPortal` unless a diagnostic handoff is unavoidable.
- Preserve existing unsupported child tag boundaries.

Verification:
- `cargo fmt --all --check`
- Focused `cargo test -p fast-react-reconciler --all-features portal begin_work root_work_loop`
- Full `cargo test -p fast-react-reconciler --all-features`
- Reconciler clippy with warnings denied
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
