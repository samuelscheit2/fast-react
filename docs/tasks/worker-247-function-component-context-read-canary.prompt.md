You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private function-component context read canary that uses the accepted core `ContextStack` during function component render records, proving deterministic default/provider reads and unwind behavior without public `useContext`, child reconciliation, effects, DOM/test-renderer integration, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- Focused reconciler tests
- `worker-progress/worker-247-function-component-context-read-canary.md`

Context to inspect:
Workers 028, 180, 194, 199, 200, 221, 222, 248.

Constraints:
- You are not alone in the codebase. Workers 248 and 249 may edit nearby function-component areas.
- Keep this private and canary-scoped.
- Do not add public hook dispatcher behavior.

Verification:
- `cargo fmt --all --check`
- Focused `cargo test -p fast-react-reconciler --all-features function_component context begin_work`
- Full `cargo test -p fast-react-reconciler --all-features`
- Reconciler clippy with warnings denied
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
