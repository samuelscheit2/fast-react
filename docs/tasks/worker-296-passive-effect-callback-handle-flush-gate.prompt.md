You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the passive effect flush gate with data-only create/destroy callback handle metadata. Prove unmount-before-mount ordering and effect ID carry remain stable while actual effect callback execution stays blocked.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-296-passive-effect-callback-handle-flush-gate.md`

Context to inspect:
Workers 173, 250, 279, 284, and 285.

Constraints:
- Do not invoke create or destroy callbacks.
- Preserve existing passive effect ID, lane, and pending handoff validation.
- No JS package `act` or renderer integration.

Verification:
- `cargo fmt --all --check`
- Focused `function_component`, `root_commit`, and `passive_effects` tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
