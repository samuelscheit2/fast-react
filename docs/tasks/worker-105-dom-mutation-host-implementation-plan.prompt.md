You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only implementation plan for the first minimal DOM mutation host slice, including owner-document handling, namespace context, instance/text creation, initial property application boundaries, update payload boundaries, mutation operations, node-token mapping prerequisites, and focused tests.

Write scope:
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement source code in this task.
- Anchor the plan in merged DOM/host reports and oracles, especially workers 040, 051, 055, 061, 062, 063, 090, and 091.
- Treat workers 088 and 089 as potentially still in flight unless their reports are already merged in your worktree; do not depend on unmerged evidence without labeling it as provisional.
- Keep the first implementation slice below public `createRoot`, hydration, resources, controlled inputs, and event dispatch. It may define the host-side operations those later features need.
- Specify exact source files expected to change in a future implementation worker, exact tests to add, and the completion gates that would prove DOM mutation host behavior without claiming full React DOM compatibility.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Handoff requirements:
- Summarize findings or implementation.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
