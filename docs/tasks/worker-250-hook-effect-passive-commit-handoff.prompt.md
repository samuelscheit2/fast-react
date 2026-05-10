You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Connect private function-component hook-effect registration metadata to pending passive commit handoff records in a deterministic data-only canary, without executing effects, scheduling public `act`, invoking callbacks, mutating host output, or claiming hook/effect compatibility.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`
- Focused reconciler tests
- `worker-progress/worker-250-hook-effect-passive-commit-handoff.md`

Context to inspect:
Workers 157, 173, 197, 200, 224, 225, 251.

Constraints:
- You are not alone in the codebase. Worker 233 may edit root commit and worker 251 may edit public hook surface.
- Data-only handoff only; no effect callback execution.
- Preserve unmount-before-mount ordering and existing pending passive guards.

Verification:
- `cargo fmt --all --check`
- Focused function_component/root_commit/passive_effects tests
- Full `cargo test -p fast-react-reconciler --all-features`
- Reconciler clippy with warnings denied
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
