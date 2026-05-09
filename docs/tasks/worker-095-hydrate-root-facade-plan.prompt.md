# worker-095-hydrate-root-facade-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-043-react-dom-hydration-plan.md, worker-progress/worker-049-react-dom-hydration-marker-oracle.md if it exists, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, worker-progress/worker-088-dom-container-root-markers-oracle.md if it exists, and worker-progress/worker-089-dom-root-listener-installation-oracle.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for hydrateRoot public facade, hydration root state, and replay hooks.

## Write Scope

- worker-progress/worker-095-hydrate-root-facade-plan.md

Do not modify source code.

## Requirements

- Cover initial children requirement, hydration root kind, dehydrated root state, recoverable errors, formState, unstable_scheduleHydration, event replay hooks, and root object sharing with createRoot.
- State why hydrateRoot cannot be a createRoot option flag.
- Include future write scopes and tests.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
