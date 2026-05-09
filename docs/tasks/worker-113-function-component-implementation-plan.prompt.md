You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only implementation plan for the first function component rendering slice, including dispatcher state, hook cursors, render-phase retry loops, bailout boundaries, error cleanup, and fake-host tests that stay below DOM/test-renderer public APIs.

Write scope:
- `worker-progress/worker-113-function-component-implementation-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement source code in this task.
- Anchor the plan in merged workers 007, 070, 071, 078, 081, 099, 100, 107 if present, and 112 if present.
- Treat source workers 047, 075, 076, and planning workers 107/112 as potentially unmerged unless their reports/changes are present in your worktree; label any dependency on them as provisional.
- Keep this slice below Suspense, context propagation beyond placeholders, DOM behavior, public React DOM roots, and test-renderer serialization.
- Specify exact future source files, Rust/JS boundary assumptions, tests, invariants, risks, and completion gates.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-113-function-component-implementation-plan.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Handoff requirements:
- Summarize findings or implementation.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
