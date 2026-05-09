# worker-080-reconciler-host-root-update-queue-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-007-scheduler-fiber.md, worker-progress/worker-044-react-dom-client-roots-plan.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, worker-progress/worker-070-core-update-queue-plan.md, worker-progress/worker-072-reconciler-root-work-loop-plan.md, and worker-progress/worker-073-test-renderer-update-model-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only implementation plan for HostRoot update queues and update_container APIs.

## Write Scope

- worker-progress/worker-080-reconciler-host-root-update-queue-plan.md

Do not modify source code.

## Requirements

- Cover circular pending queues, base queue rebasing, skipped lanes, callbacks, null unmount updates, payload {element}, and transition entanglement hooks.
- Specify Rust module boundaries and tests for update_container/update_container_sync without DOM mutation.
- Treat worker 047 as unavailable unless it has merged in this worktree.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
