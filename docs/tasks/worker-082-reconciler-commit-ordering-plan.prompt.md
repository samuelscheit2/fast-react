# worker-082-reconciler-commit-ordering-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-018-test-renderer-mutation-host.md, worker-progress/worker-019-reconciler-host-boundary-migration.md, worker-progress/worker-022-host-operation-errors.md, worker-progress/worker-071-core-fiber-flags-effect-plan.md, worker-progress/worker-072-reconciler-root-work-loop-plan.md, and worker-progress/worker-073-test-renderer-update-model-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only implementation plan for commit ordering, host mutation phase calls, and root.current switching.

## Write Scope

- worker-progress/worker-082-reconciler-commit-ordering-plan.md

Do not modify source code.

## Requirements

- Cover before-mutation, mutation, root.current switch, layout, passive scheduling, deletion detach, ref detach/attach, and host prepare/reset ordering.
- Use test renderer as the first operation-order canary.
- Do not claim DOM behavior compatibility.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
