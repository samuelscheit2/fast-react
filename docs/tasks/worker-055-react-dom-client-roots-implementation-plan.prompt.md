You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only implementation plan for React DOM client root objects, `createRoot`, `hydrateRoot`, `root.render`, `root.unmount`, event setup, root lifecycle markers, and integration with the Rust core/reconciler boundary.

Write scope:
`worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement code.
- Use merged evidence from workers 007, 008, 030, 033, and 044. Treat active worker 046 as unavailable unless its output is already merged.
- Identify root causes and implementation dependencies rather than proposing thin placeholders.
- Split the plan into independently mergeable future worker slices with concrete write scopes and verification.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record the full report in `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run no source tests unless you create temporary local probes.
- Check the report for concrete local path leaks and trailing whitespace.

Handoff requirements:
- Summarize the recommended implementation sequence.
- List evidence files consulted and any commands run.
- List unresolved risks or follow-up tasks.
