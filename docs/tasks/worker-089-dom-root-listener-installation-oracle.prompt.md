# worker-089-dom-root-listener-installation-oracle

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-041-dom-events-priority-plan.md, worker-progress/worker-044-react-dom-client-roots-plan.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, and worker-progress/worker-065-dom-event-delegation-oracle.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic React DOM root and portal listener installation oracle files.

## Write Scope

- tests/conformance/src/react-dom-root-listener-installation-*.mjs
- tests/conformance/scripts/*react-dom-root-listener-installation*.mjs
- tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json
- worker-progress/worker-089-dom-root-listener-installation-oracle.md

## Requirements

- Probe root listener registration, selectionchange owner document registration, non-delegated events, dedupe behavior, and portal listener installation where deterministic.
- Keep dispatch/plugin behavior out of scope unless needed to observe installation.
- Do not overlap active worker 065 merged files or active worker 046 files.
- Run targeted node --test, local path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
