You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only test plan for the first end-to-end root render/update/unmount path, mapping `createRoot().render()`, HostRoot updates, commit/mutation behavior, `flushSync`, and root unmount to concrete conformance and integration tests without claiming unsupported hydration, events, controlled forms, Suspense, or hooks behavior.

Write scope:
- `worker-progress/worker-106-root-render-e2e-test-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement source code in this task.
- Anchor the plan in merged evidence from workers 044, 055, 058, 061, 062, 063, 072, 079, 081, 082, 090, 091, 092 if present, 093 if present, and 094.
- Treat workers 046, 049, 088, 089, 092, 093, and 095 as potentially still in flight unless their reports are already merged in your worktree; do not depend on unmerged evidence without labeling it as provisional.
- Split tests into layers: JS facade behavior, reconciler/root unit tests, fake-host commit tests, DOM mutation host tests, and conformance dual-run oracles.
- Identify the minimum green path, explicit non-goals, sequencing dependencies, and failure diagnostics needed before this project can claim a real root render milestone.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-106-root-render-e2e-test-plan.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Handoff requirements:
- Summarize findings or implementation.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
