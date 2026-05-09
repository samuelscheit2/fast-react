# worker-085-react-test-renderer-serialization-oracle

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-017-runtime-inventory-generation.md, worker-progress/worker-073-test-renderer-update-model-plan.md, and worker-progress/worker-083-react-test-renderer-export-oracle.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, call create_goal again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic react-test-renderer toJSON, toTree, and TestInstance serialization oracle files.

## Write Scope

- tests/conformance/src/react-test-renderer-serialization-*.mjs
- tests/conformance/scripts/*react-test-renderer-serialization*.mjs
- tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json
- worker-progress/worker-085-react-test-renderer-serialization-oracle.md

## Requirements

- Probe host nodes, text nodes, empty roots, hidden/null outputs where deterministic, props without children, composite toTree nodes, and find/findAll basics.
- Keep oracle generation exact-tarball based and local Fast React statuses explicit.
- Do not edit shared package manifests unless necessary.
- Run targeted node --test, scoped local path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
