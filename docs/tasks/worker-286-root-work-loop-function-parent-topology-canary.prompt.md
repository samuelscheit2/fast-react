You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private root-work-loop canary that preserves FunctionComponent parent topology while handing its single HostComponent/HostText child to complete-work, without broad traversal, arrays, keys, fragments, portals, Suspense, effects, public renderer output, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `worker-progress/worker-286-root-work-loop-function-parent-topology-canary.md`

Context to inspect:
Workers 194, 199, 203, 249, 282, 283.

Constraints:
- Private canary only.
- Preserve fail-closed unsupported child behavior.
- Do not implement generic traversal.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
