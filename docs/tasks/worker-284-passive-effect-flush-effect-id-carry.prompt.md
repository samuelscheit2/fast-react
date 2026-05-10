You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the private passive effects flush skeleton so handoff records carry deterministic effect ids through unmount/mount flush records, still data-only and without executing destroy/create callbacks, scheduling public `act`, mutating hosts, or claiming hook/effect compatibility.

Write scope:
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-284-passive-effect-flush-effect-id-carry.md`

Context to inspect:
Workers 157, 173, 197, 224, 225, 250, 279.

Constraints:
- Data-only records; no callback execution.
- Preserve unmount-before-mount ordering.
- Validate count/lane drift before consuming pending state.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features passive_effects`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
