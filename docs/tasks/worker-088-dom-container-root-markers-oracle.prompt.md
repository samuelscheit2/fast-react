# worker-088-dom-container-root-markers-oracle

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-033-react-dom-inventory.md, worker-progress/worker-044-react-dom-client-roots-plan.md, and worker-progress/worker-055-react-dom-client-roots-implementation-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, call create_goal again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic React DOM container validation and root marker oracle files.

## Write Scope

- tests/conformance/src/react-dom-container-root-markers-*.mjs
- tests/conformance/scripts/*react-dom-container-root-markers*.mjs
- tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json
- worker-progress/worker-088-dom-container-root-markers-oracle.md

## Requirements

- Probe createRoot container validation, duplicate-root warnings, marker side effects visible through public behavior, unmount marker cleanup, and no direct DOM mutation before render where deterministic.
- Use a deterministic DOM environment or exact-tarball source probes if runtime DOM setup is not available; document the choice.
- Do not overlap active worker 046 files.
- Run targeted node --test, local path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
