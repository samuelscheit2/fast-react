# worker-083-react-test-renderer-export-oracle

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-017-runtime-inventory-generation.md, and worker-progress/worker-073-test-renderer-update-model-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, call create_goal again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic react-test-renderer 19.2.6 package export and descriptor oracle files.

## Write Scope

- tests/conformance/src/react-test-renderer-export-*.mjs
- tests/conformance/scripts/*react-test-renderer-export*.mjs
- tests/conformance/test/react-test-renderer-export-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json
- worker-progress/worker-083-react-test-renderer-export-oracle.md

Do not edit package manifests unless the test cannot run otherwise; npm test already discovers test/*.test.mjs.

## Requirements

- Probe the exact react-test-renderer@19.2.6 tarball and dependency behavior without mutating root manifests or running lifecycle scripts.
- Capture export keys, descriptors, package metadata, shallow removal, deprecation warning surfaces, and mode/condition differences where deterministic.
- Compare local Fast React only as explicit unsupported/placeholder evidence; do not claim compatibility.
- Run the targeted node --test file, scoped path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
