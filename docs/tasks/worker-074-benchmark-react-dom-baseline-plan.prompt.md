You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
Call create_goal for this worker task. If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only benchmark plan for React DOM compatibility and performance baselines, including benchmark scenarios, semantic gates, React 19.2.6 comparison setup, runner isolation, metrics, and when not to benchmark yet.

Write scope:
`worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement code.
- Use merged evidence from workers 009, 033, 040, and 044. Treat active workers 046 through 052 as unavailable unless their output is already merged.
- Benchmark plans must be gated by compatibility evidence; do not optimize placeholder behavior.
- Split future work into independently mergeable benchmark/tooling slices with concrete write scopes and verification.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record the full report in `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run no source tests unless you create temporary local probes.
- Check the report for concrete local path leaks and trailing whitespace.

Handoff requirements:
- Summarize the recommended benchmark sequence.
- List evidence files consulted and any commands run.
- List unresolved risks or follow-up tasks.
