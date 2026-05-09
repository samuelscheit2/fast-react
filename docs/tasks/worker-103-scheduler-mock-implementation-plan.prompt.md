You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker-progress/worker-034-scheduler-package-inventory.md, worker-progress/worker-039-scheduler-variant-oracles.md, worker-progress/worker-045-scheduler-root-implementation.md, and worker-progress/worker-052-scheduler-mock-oracle.md. Do not read ORCHESTRATOR.md unless explicitly asked by the orchestrator.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask with all context about the parent task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only implementation plan for `scheduler/unstable_mock` compatibility, including virtual time, deterministic flushing helpers, priority/log behavior, integration boundaries with the root scheduler package, and the conformance gates needed before upstream-style React scheduler tests can rely on it.

Write scope:
- `worker-progress/worker-103-scheduler-mock-implementation-plan.md`

Constraints:
- Do not modify source, package, conformance, smoke, or task-planning files.
- Do not overlap with active source workers; this is a report-only planning task.
- Treat `scheduler@0.27.0` as the compatibility baseline established by prior scheduler reports.
- Use the existing scheduler reports and local package shape to find root causes and implementation boundaries; do not patch symptoms.
- Introduce breaking changes in the plan if necessary, but document why.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Regenerable generated artifacts such as node_modules, target, and root Cargo.lock do not need cleanup merely because they exist.
- Before finishing, review the plan for quality, maintainability, performance, and security.

Report requirements:
- Explain the required public `scheduler/unstable_mock` API and observable behavior.
- Identify how mock scheduler state should stay isolated from the root scheduler implementation while sharing safe primitives where useful.
- Specify implementation phases, tests to add, and exact verification commands a future implementation worker should run.
- List changed files, commands run, unresolved risks, and whether nested agents were used.
