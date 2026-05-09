You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
Call create_goal for this worker task. If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Produce a report-only implementation plan for React DOM server and static rendering, including legacy string rendering, Node streams, Web Streams, prerender/resume APIs, and Fizz-compatible internal boundaries.

Write scope:
`worker-progress/worker-056-react-dom-server-static-implementation-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement code.
- Use merged evidence from workers 005, 033, 042, and 043. Treat active worker 050 as unavailable unless its output is already merged.
- Separate public package entrypoint compatibility from real server rendering semantics.
- Split future work into independently mergeable slices with concrete write scopes and verification.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record the full report in `worker-progress/worker-056-react-dom-server-static-implementation-plan.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run no source tests unless you create temporary local probes.
- Check the report for concrete local path leaks and trailing whitespace.

Handoff requirements:
- Summarize the recommended implementation sequence.
- List evidence files consulted and any commands run.
- List unresolved risks or follow-up tasks.
