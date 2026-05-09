# worker-098-dom-event-plugin-extraction-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-041-dom-events-priority-plan.md, worker-progress/worker-048-react-dom-event-priority-oracle.md, worker-progress/worker-065-dom-event-delegation-oracle.md, and worker-progress/worker-089-dom-root-listener-installation-oracle.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for DOM event plugin extraction, update priority, batching, propagation, and controlled-state restore.

## Write Scope

- worker-progress/worker-098-dom-event-plugin-extraction-plan.md

Do not modify source code.

## Requirements

- Cover event target resolution from DOM node maps, plugin extraction boundaries, capture/bubble dispatch queues, update priority, batching, portals, passive flags, and controlled component restoration.
- Keep root listener installation and hydration replay as separate layers unless their hooks are required.
- Include future write scopes and tests.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
