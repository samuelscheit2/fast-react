You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless explicitly asked.
Call create_goal for this worker task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only React DOM TypeScript declaration shipping policy for Fast React.

Write scope:
`worker-progress/worker-053-react-dom-types-policy.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement package or declaration files.
- Use workers 033, 036, 037, and 035.
- Decide whether the next implementation should reference `@types/react-dom`, ship owned declaration shims, or deliberately defer TypeScript compatibility. Include runtime/type gaps, `react-server` condition gaps, `profiling`, `canary`/`experimental`, and package naming implications.
- Recommend non-overlapping follow-up workers with concrete write scopes.
- Record progress in `worker-progress/worker-053-react-dom-types-policy.md`.

Verification:
- Check report for concrete evidence, local path leaks, trailing whitespace, and clear follow-up scopes.

Handoff requirements:
- Summarize policy recommendation.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
