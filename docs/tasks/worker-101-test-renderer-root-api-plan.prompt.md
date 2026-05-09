# worker-101-test-renderer-root-api-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-018-test-renderer-mutation-host.md, worker-progress/worker-022-host-operation-errors.md, worker-progress/worker-073-test-renderer-update-model-plan.md, worker-progress/worker-081-reconciler-root-scheduler-act-plan.md, and worker-progress/worker-096-native-root-boundary-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for Rust test-renderer root API create/update/unmount integration with shared reconciler roots.

## Write Scope

- worker-progress/worker-101-test-renderer-root-api-plan.md

Do not modify source code.

## Requirements

- Cover TestRendererRoot, options, create/update/unmount, flush_sync, root invalidation, operation log canary behavior, and separation from direct host mutation APIs.
- Keep serialization and TestInstance querying as separate implementation slices.
- Include future write scopes and focused Rust tests.
- Verify report-only scope with no local path leaks, no trailing whitespace, and git diff --check.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
