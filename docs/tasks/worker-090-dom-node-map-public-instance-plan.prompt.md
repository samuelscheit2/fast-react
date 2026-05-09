# worker-090-dom-node-map-public-instance-plan

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-040-dom-mutation-renderer-plan.md, worker-progress/worker-041-dom-events-priority-plan.md, worker-progress/worker-044-react-dom-client-roots-plan.md, worker-progress/worker-051-dom-host-token-boundary.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, and worker-progress/worker-072-reconciler-root-work-loop-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, call create_goal again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for DOM node maps, public instance lookup, latest props maps, and cleanup.

## Write Scope

- worker-progress/worker-090-dom-node-map-public-instance-plan.md

Do not modify source code.

## Requirements

- Define how reconciler-issued host tokens map to DOM nodes without exposing raw fibers.
- Cover latest props, event target lookup, deletion cleanup, stale token rejection, and memory retention risks.
- Include future write scopes and tests.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
