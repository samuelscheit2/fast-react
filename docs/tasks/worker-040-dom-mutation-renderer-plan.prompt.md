You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only DOM mutation host implementation plan for Fast React.

Write scope:
`worker-progress/worker-040-dom-mutation-renderer-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement code in this worker.
- Use worker 008, worker 012, worker 018, worker 019, and worker 033 reports as local evidence.
- Map React DOM 19.2.6 mutation host requirements to likely Fast React crate/package boundaries without collapsing DOM specifics into renderer-agnostic core.
- Include element/text instance creation, namespaces, attributes/properties/styles, custom elements, controlled inputs/selects/textareas/forms, mutation commits, container validation, root markers, instance-to-fiber maps, public instance lookup, focus helpers, and test selector implications.
- Recommend implementation slices with concrete non-overlapping write scopes for future workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-040-dom-mutation-renderer-plan.md`.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification:
- Check the report for concrete evidence, no local temp path leaks, no trailing whitespace, and clear follow-up worker scopes.

Handoff requirements:
- Summarize the plan.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
