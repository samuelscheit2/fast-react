# worker-077-core-fiber-topology-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-007-scheduler-fiber.md, worker-progress/worker-030-core-lane-model.md, worker-progress/worker-071-core-fiber-flags-effect-plan.md, and worker-progress/worker-072-reconciler-root-work-loop-plan.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for core fiber topology, stable IDs, alternates, parent/child/sibling links, and deletion storage.

## Write Scope

- worker-progress/worker-077-core-fiber-topology-plan.md

Do not modify source code.

## Requirements

- Test the hypothesis that topology belongs in core versus reconciler with evidence from merged reports and current Rust crate boundaries.
- Specify data model invariants for FiberId, alternate pairs, parent-owned deletions, childLanes, flags/subtreeFlags, host state handles, and arena ownership.
- Split future implementation into mergeable scopes that do not conflict with workers 047, 075, or 076.
- Verify report-only scope with git status, no concrete local path leaks, no trailing whitespace, and git diff --check or equivalent no-index checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
