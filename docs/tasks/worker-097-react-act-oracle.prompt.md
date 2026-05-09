# worker-097-react-act-oracle

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-017-runtime-inventory-generation.md, worker-progress/worker-025-children-helpers.md, worker-progress/worker-067-react-dom-test-utils-act-oracle.md, worker-progress/worker-073-test-renderer-update-model-plan.md, and worker-progress/worker-086-react-test-renderer-act-oracle.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Add deterministic React 19.2.6 public act behavior oracle files.

## Write Scope

- tests/conformance/src/react-act-*.mjs
- tests/conformance/scripts/*react-act*.mjs
- tests/conformance/test/react-act-oracle.test.mjs
- tests/conformance/oracles/react-19.2.6-react-act-oracle.json
- worker-progress/worker-097-react-act-oracle.md

Do not edit shared package manifests unless the test cannot run otherwise; npm test already discovers test/*.test.mjs.

## Requirements

- Probe public React.act export descriptors, development/production availability, sync callback behavior, async callback behavior, no-await warnings, thrown/rejected errors, and thenable handling where deterministic.
- Keep renderer-backed flushing out of scope; React DOM and test-renderer wrappers have separate oracle tracks.
- Compare local Fast React only as explicit unsupported/known-mismatch evidence; do not claim compatibility.
- Run targeted node --test, scoped path leak checks, trailing whitespace checks, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
