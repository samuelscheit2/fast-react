You are worker-014-react-entrypoint-placeholders for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-004-api-inventory.md`, `worker-progress/worker-010-initial-scaffold.md`, and `worker-progress/worker-011-core-element-model.md` if it exists in your worktree. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call `create_goal` again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Improve the JavaScript React package placeholders and smoke tests using the accepted API inventory. Keep behavior explicitly unimplemented where it cannot yet be proven, but make the package surface and error messages more useful for upcoming conformance work.

Write scope:
Only modify:

- `packages/react/**`
- `tests/smoke/**`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests, Rust crates, or conformance package files.
- Do not claim real React behavior compatibility yet.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification requirements:
- Run `node tests/smoke/import-entrypoints.mjs`.
- Run `npm run check:js`.
- Run `npm run check` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- React entrypoint implementation summary
- Verification results
- Deviations from worker-004 recommendation, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
