You are worker-006-binding-strategy for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Design the initial JS-to-Rust binding strategy for Fast React. Focus on N-API, napi-rs, Node version support, package entrypoints, native artifact layout, dev/prod builds, and risks of exposing JS-observable React semantics through a native boundary.

Write scope:
Only write `worker-progress/worker-006-binding-strategy.md`.

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
- N-API and napi-rs evidence
- Binding architecture recommendation
- Package artifact and entrypoint recommendation
- Dev/prod build strategy
- JS-observable semantic risks
- CI and release implications
- Proposed follow-up implementation tasks
- Completion checklist

Handoff requirements:
- Summarize findings.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
