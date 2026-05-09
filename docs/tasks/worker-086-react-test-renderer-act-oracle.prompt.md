# worker-086-react-test-renderer-act-oracle

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-017-runtime-inventory-generation.md, worker-progress/worker-041-dom-events-priority-plan.md, worker-progress/worker-073-test-renderer-update-model-plan.md, and worker-progress/worker-083-react-test-renderer-export-oracle.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic react-test-renderer act and flushSync scheduling oracle files.

## Write Scope

- tests/conformance/src/react-test-renderer-act-*.mjs
- tests/conformance/scripts/*react-test-renderer-act*.mjs
- tests/conformance/test/react-test-renderer-act-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-test-renderer-act-oracle.json
- worker-progress/worker-086-react-test-renderer-act-oracle.md

## Requirements

- Probe exported act, async act warning surfaces where deterministic, update flushing, scheduler exposure, unstable_flushSync, and thrown error aggregation.
- Avoid flaky timing; prefer deterministic Scheduler/test-renderer observables.
- Do not edit shared package manifests unless necessary.
- Run targeted node --test, scoped local path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
