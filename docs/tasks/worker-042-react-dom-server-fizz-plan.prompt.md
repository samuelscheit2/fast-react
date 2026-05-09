You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only React DOM server/static Fizz compatibility plan.

Write scope:
`worker-progress/worker-042-react-dom-server-fizz-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement code in this worker.
- Use worker 005, worker 033, and React DOM 19.2.6 source/package evidence.
- Cover legacy string rendering, Node streams, Web Streams, Bun/edge/browser variants, static prerendering, postponed state, resume state, Suspense/Activity markers, resource headers, bootstrap scripts/modules/import maps, abort semantics, stream adapters, and hydration marker contracts.
- Keep server/Fizz work separate from client DOM mutation and hydration implementation.
- Recommend implementation slices with concrete non-overlapping write scopes for future workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-042-react-dom-server-fizz-plan.md`.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification:
- Check the report for concrete evidence, no local temp path leaks, no trailing whitespace, and clear follow-up worker scopes.

Handoff requirements:
- Summarize the plan.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
