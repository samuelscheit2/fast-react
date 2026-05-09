# worker-081-reconciler-root-scheduler-act-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-007-scheduler-fiber.md, worker-progress/worker-041-dom-events-priority-plan.md, worker-progress/worker-044-react-dom-client-roots-plan.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, worker-progress/worker-072-reconciler-root-work-loop-plan.md, and worker-progress/worker-073-test-renderer-update-model-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only implementation plan for root scheduling, cross-root sync flushing, and act queue routing.

## Write Scope

- worker-progress/worker-081-reconciler-root-scheduler-act-plan.md

Do not modify source code.

## Requirements

- Cover scheduled-root lists, microtasks, Scheduler callback reuse/cancelation, sync flushing, continuation handling, reentrancy guards, and React act queue integration.
- Keep public scheduler package behavior separate from reconciler scheduler internals.
- Include fake scheduler and fake act queue test strategy.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
