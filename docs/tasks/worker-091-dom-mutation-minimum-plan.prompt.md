# worker-091-dom-mutation-minimum-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-040-dom-mutation-renderer-plan.md, worker-progress/worker-051-dom-host-token-boundary.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, worker-progress/worker-061-dom-attribute-property-oracle.md, worker-progress/worker-062-dom-style-dangerous-html-oracle.md if it exists, and worker-progress/worker-063-dom-namespace-svg-oracle.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for minimal DOM mutation host creation, namespace context, properties, and mutation operations.

## Write Scope

- worker-progress/worker-091-dom-mutation-minimum-plan.md

Do not modify source code.

## Requirements

- Cover ownerDocument, namespace selection, element/text creation, append/insert/remove/clear, text update, hide/unhide, initial properties, and update payload boundaries.
- Separate minimal mutation from controlled inputs, hydration, resources, singletons, and event dispatch.
- Include future write scopes and tests.
- Verify report-only scope with standard report checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
