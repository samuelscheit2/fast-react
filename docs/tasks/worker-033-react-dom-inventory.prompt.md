You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Build a report-only React DOM 19.2.6 compatibility inventory that identifies package subpaths, public exports, renderer/client/server/static surfaces, and the smallest safe implementation slices for future Fast React DOM work.

Write scope:
`worker-progress/worker-033-react-dom-inventory.md`

Constraints:
- Do not modify files outside your write scope.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-033-react-dom-inventory.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Research guidance:
- Use pinned React DOM 19.2.6 package metadata and tarball/source evidence.
- Inventory `react-dom`, `react-dom/client`, server/static subpaths, profiling/test-utils, conditional exports, type implications, and public runtime exports.
- Separate easy package-surface placeholders from behavior that needs a renderer, DOM, hydration, events, resource/singleton support, or server streaming.
- Recommend non-overlapping follow-up workers with concrete write scopes.
- Do not implement code in this worker.

Verification:
- Record exact commands and versions used.
- Check the report for concrete evidence and no local temp path leaks.

Handoff requirements:
- Summarize findings.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
