# worker-076-core-fiber-flags

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-007-scheduler-fiber.md, worker-progress/worker-030-core-lane-model.md, worker-progress/worker-071-core-fiber-flags-effect-plan.md, and worker-progress/worker-072-reconciler-root-work-loop-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Implement core fiber flags and hook effect flags as renderer-agnostic Rust bitsets.

## Write Scope

- crates/fast-react-core/src/fiber_flags.rs
- crates/fast-react-core/src/hook_effect_flags.rs
- crates/fast-react-core/src/lib.rs
- worker-progress/worker-076-core-fiber-flags.md

Do not implement fibers, roots, update queues, or reconciler commit traversal in this worker.

## Requirements

- Model React-style flags as combinable bitsets, not a mutually exclusive enum.
- Include host effect, static, before-mutation, mutation, layout, passive, and hook effect masks identified by the merged plan.
- Add focused tests for mask membership, aliases, empty flags, and bitwise operations.
- Run cargo fmt --all --check, cargo test -p fast-react-core --all-features, cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings, and git diff --check.
- Write a progress report with exact coverage and any intentionally deferred flags.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
