You are worker-013-conformance-inventory-tooling for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-002-conformance.md`, `worker-progress/worker-004-api-inventory.md`, and `worker-progress/worker-010-initial-scaffold.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, use `/goal` (`create_goal`) again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Implement the first conformance inventory tooling inside `tests/conformance`. It should be able to describe the pinned React 19.2.6 package targets and provide a deterministic placeholder for future tarball/runtime/type inventory generation without claiming real conformance yet.

Write scope:
Only modify:

- `tests/conformance/**`
- `worker-progress/worker-013-conformance-inventory-tooling.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests.
- Do not add dependencies that require root manifest or lockfile changes.
- Do not implement the full dual-run oracle harness yet.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification requirements:
- Run `npm test --workspace @fast-react/conformance`.
- Run `npm run test:conformance`.
- Run `npm run check` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- Inventory tooling implementation summary
- Verification results
- Deviations from worker-002 or worker-004 recommendations, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
