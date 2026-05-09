You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only implementation plan for reconciler sync flushing and `act` integration, including cross-root sync work flushing, render/commit reentrancy guards, act queue routing, priority override boundaries, and how React DOM/test-renderer facades should call the shared scheduler layer.

Write scope:
- `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement source code in this task.
- Anchor the plan in merged workers 007, 041, 044, 055, 058, 067, 073, 080, 081, 086 if present, 094, and 097 if present.
- Treat workers 086, 097, 100, 101, and 103 as potentially unmerged unless their reports/oracles are present in your worktree; label any dependency on them as provisional.
- Keep this plan below Suspense, transitions beyond recorded placeholders, real DOM event dispatch, and full test-renderer serialization.
- Specify exact future source files, JS facade call sites, unit/conformance tests, reentrancy diagnostics, and completion gates.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Handoff requirements:
- Summarize findings or implementation.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
