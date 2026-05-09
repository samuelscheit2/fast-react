You are worker-004-api-inventory for the Fast React project.

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Call `create_goal` for this worker task if available. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Build an evidence-backed public API inventory for the React 19.2.6 compatibility target. Focus on package exports, runtime export keys, TypeScript declaration surfaces, subpath entrypoints, and places where runtime behavior differs from declarations.

Write scope:
Only write `worker-progress/worker-004-api-inventory.md`.

Constraints:
- Do not modify files outside your write scope.
- Do not implement project code.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review your findings for quality, maintainability, performance, and security implications.

Required report sections:
- Objective
- Sources and commands used
- Package and subpath export inventory
- Runtime export inventory
- Type declaration inventory
- Divergences between runtime exports and types
- Inventory automation recommendation
- Compatibility risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist

Handoff requirements:
- Summarize findings.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
