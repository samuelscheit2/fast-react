You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add private hook-effect destroy handle metadata through function component render, root commit handoff, and passive flush records. Keep actual effect callback invocation and public `useEffect` behavior blocked.

Write scope:
- `crates/fast-react-core/src/hook_effect.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-301-hook-effect-destroy-handoff-metadata.md`

Context to inspect:
Workers 157, 250, 279, 284, and 296 if present.

Constraints:
- Data-only destroy handles; do not execute destroy callbacks.
- Preserve dependency equality behavior and passive effect ordering.
- No JS facade or public act integration.

Verification:
- `cargo fmt --all --check`
- Focused hook effect, function-component, root-commit, and passive-effect tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
