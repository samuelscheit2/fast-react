You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private function-component `useState` update render canary that processes a queued state update through accepted hook queue metadata during function render and records the resulting state handle, without public hooks, JS dispatcher wiring, child reconciliation broadening, effects, renderer output, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs` only if a root canary is needed
- `worker-progress/worker-283-function-component-state-update-render-canary.md`

Context to inspect:
Workers 158, 192, 200, 220, 223, 249, 278.

Constraints:
- Private Rust-only canary.
- Do not expose JS hook behavior.
- Keep render-phase updates and lane handling explicit.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo test -p fast-react-reconciler --all-features root_work_loop` if touched
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
