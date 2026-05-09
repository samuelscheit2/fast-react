# worker-102-test-renderer-serialization-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-018-test-renderer-mutation-host.md, worker-progress/worker-022-host-operation-errors.md, worker-progress/worker-073-test-renderer-update-model-plan.md, worker-progress/worker-085-react-test-renderer-serialization-oracle.md if it exists, and worker-progress/worker-101-test-renderer-root-api-plan.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for test-renderer toJSON, toTree, and TestInstance serialization over committed fibers.

## Write Scope

- worker-progress/worker-102-test-renderer-serialization-plan.md

Do not modify source code.

## Requirements

- Cover JSON host output, text nodes, hidden/null output, props excluding children, toTree composite nodes, TestInstance traversal, find/findAll errors, and unmounted root behavior.
- Keep root lifecycle and act flushing as separate implementation slices.
- Include future write scopes and focused Rust tests.
- Verify report-only scope with no local path leaks, no trailing whitespace, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
