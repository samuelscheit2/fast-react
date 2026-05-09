# worker-096-native-root-boundary-plan

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-006-binding-strategy.md, worker-progress/worker-015-native-loader-boundary.md, worker-progress/worker-032-native-boundary-guardrails.md, worker-progress/worker-055-react-dom-client-roots-implementation-plan.md, and worker-progress/worker-079-reconciler-fiber-root-model-plan.md if it exists. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

## Objective

Produce a report-only plan for private native root handles, JS callback lifetime boundaries, and coarse JS-to-Rust root operations.

## Write Scope

- worker-progress/worker-096-native-root-boundary-plan.md

Do not modify source code.

## Requirements

- Keep public React DOM values JS-owned and private root handles opaque.
- Cover root creation/update/unmount calls, callback rooting/disposal, thread/reentrancy rules, native load guardrails, and error mapping.
- Identify future write scopes for bindings/node and fast-react-napi without claiming public compatibility.
- Verify report-only scope with git status, no concrete local path leaks, no trailing whitespace, and git diff --check or equivalent no-index checks.

Nested agents are allowed inside this tmux worker and do not count against the orchestrator top-level worker cap. Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
