# worker-075-core-event-priority

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-030-core-lane-model.md, worker-progress/worker-041-dom-events-priority-plan.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, and worker-progress/worker-073-test-renderer-update-model-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Implement lane-backed core event priority primitives in fast-react-core.

## Write Scope

- crates/fast-react-core/src/event_priority.rs
- crates/fast-react-core/src/lib.rs
- worker-progress/worker-075-core-event-priority.md

Do not edit React DOM, scheduler, conformance oracle files, or reconciler modules in this worker.

## Requirements

- Add an EventPriority representation that maps to the existing Lane/Lanes model without inventing a renderer-local priority enum.
- Cover No, Discrete, Continuous, Default, and Idle priorities plus lane conversion and ordering helpers.
- Use names and semantics consistent with the merged event/root planning reports.
- Add focused Rust unit tests in the owned module.
- Run cargo fmt --all --check, cargo test -p fast-react-core --all-features, cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings, and git diff --check.
- Write a progress report with files changed, commands run, remaining risks, and whether nested agents were used.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
