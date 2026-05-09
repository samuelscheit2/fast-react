# worker-084-react-test-renderer-root-lifecycle-oracle

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-017-runtime-inventory-generation.md, worker-progress/worker-073-test-renderer-update-model-plan.md, and worker-progress/worker-083-react-test-renderer-export-oracle.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic react-test-renderer create/update/unmount root lifecycle oracle files.

## Write Scope

- tests/conformance/src/react-test-renderer-root-lifecycle-*.mjs
- tests/conformance/scripts/*react-test-renderer-root-lifecycle*.mjs
- tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json
- worker-progress/worker-084-react-test-renderer-root-lifecycle-oracle.md

## Requirements

- Probe create(), update(), unmount(), getInstance(), .root access, createNodeMock, strict/concurrent options, and post-unmount errors.
- Keep scenarios deterministic and independent of implementation workers.
- Do not edit shared package manifests unless necessary.
- Run targeted node --test, scoped local path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
