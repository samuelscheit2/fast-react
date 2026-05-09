You are worker-005-upstream-tests for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Assess whether and how upstream React tests can be reused for Fast React. Focus on the React 19.2.6 source tag, package test layout, renderer assumptions, required harness shims, and which upstream tests should gate early milestones.

Write scope:
Only write `worker-progress/worker-005-upstream-tests.md`.

Constraints:
- Do not modify files outside your write scope.
- Do not implement project code.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review your findings for quality, maintainability, performance, and security implications.

Required report sections:
- Objective
- Sources and commands used
- Upstream React source and tag evidence
- Test layout and categories
- Reuse feasibility by milestone
- Required harness shims or adapters
- Tests to avoid initially and why
- Legal/licensing or maintenance risks
- Proposed follow-up implementation tasks
- Completion checklist

Handoff requirements:
- Summarize findings.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
