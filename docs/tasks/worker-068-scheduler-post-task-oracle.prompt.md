You are a worker for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic `scheduler@0.27.0/unstable_post_task` behavior oracle files, including export shape, environment feature detection, fallback/unsupported behavior, task scheduling observations that are stable in Node, and descriptor behavior.

Write scope:
`tests/conformance/src/scheduler-post-task-*.mjs`
`tests/conformance/scripts/*scheduler-post-task*.mjs`
`tests/conformance/test/scheduler-post-task-oracle.test.mjs`
`tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json`
`worker-progress/worker-068-scheduler-post-task-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, shared conformance helpers, package metadata, `packages/scheduler/**`, or Fast React implementation files.
- Keep filenames uniquely under the `scheduler-post-task` prefix.
- Generate evidence from exact scheduler 0.27.0 packages using existing conformance patterns where possible.
- Avoid nondeterministic timing claims; include only stable observations in the oracle.
- Include deterministic path normalization and local path leak checks.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record progress in `worker-progress/worker-068-scheduler-post-task-oracle.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run the targeted oracle generator/test.
- Run `npm test --workspace @fast-react/conformance` if practical.
- Run scoped whitespace/path/conflict checks over changed files.

Handoff requirements:
- Summarize oracle coverage and intentional gaps.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
