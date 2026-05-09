# worker-093-root-render-integration-plan

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-044-react-dom-client-roots-plan.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, worker-progress/worker-080-reconciler-host-root-update-queue-plan.md if it exists, worker-progress/worker-081-reconciler-root-scheduler-act-plan.md if it exists, and worker-progress/worker-092-react-dom-create-root-facade-plan.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, call create_goal again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for root.render integration with HostRoot updates and scheduling.

## Write Scope

- worker-progress/worker-093-root-render-integration-plan.md

Do not modify source code.

## Requirements

- Cover render return value, callback warnings, element payload updates, event/transition lane selection, reentrancy, render-after-unmount errors, and host commit path requirements.
- Identify exact prerequisites and tests before implementation.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
