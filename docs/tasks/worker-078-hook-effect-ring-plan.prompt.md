# worker-078-hook-effect-ring-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-007-scheduler-fiber.md, worker-progress/worker-071-core-fiber-flags-effect-plan.md, and worker-progress/worker-073-test-renderer-update-model-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for per-fiber hook effect rings, insertion/layout/passive effect metadata, and callback storage.

## Write Scope

- worker-progress/worker-078-hook-effect-ring-plan.md

Do not modify source code.

## Requirements

- Reject a global fiber effect list and explain the per-fiber ring model required by React 19.2.6.
- Define effect IDs, ring append/traversal invariants, destroy/create storage, deps handles, and JS callback rooting risks.
- Identify how this integrates with worker 076 flags if it lands first.
- Verify report-only scope with git status, no local path leaks, no trailing whitespace, and git diff --check or equivalent no-index checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
