# worker-099-core-hook-state-queue-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-007-scheduler-fiber.md, worker-progress/worker-070-core-update-queue-plan.md, and worker-progress/worker-078-hook-effect-ring-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for hook state queues, eager state, render-phase updates, base queues, and optimistic updates.

## Write Scope

- worker-progress/worker-099-core-hook-state-queue-plan.md

Do not modify source code.

## Requirements

- Cover useState/useReducer queue data, pending ring merge, baseQueue/baseState, eager state bailout, render-phase update storage, interleaved updates, and optimistic revert lanes.
- Keep hook effect rings separate from hook state queues except where shared IDs are needed.
- Include future write scopes and focused Rust test strategy.
- Verify report-only scope with no local path leaks, no trailing whitespace, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
