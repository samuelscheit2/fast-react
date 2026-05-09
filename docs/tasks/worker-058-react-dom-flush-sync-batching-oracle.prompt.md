You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
Call create_goal for this worker task. If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM 19.2.6 `flushSync` and `unstable_batchedUpdates` public behavior oracle files, focusing on callable shape, return values, error propagation, nested calls, priority-observable behavior that can be probed without private internals, and rootless behavior.

Write scope:
`tests/conformance/src/react-dom-flush-sync-batching-*.mjs`
`tests/conformance/scripts/*react-dom-flush-sync-batching*.mjs`
`tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json`
`worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, shared conformance helpers, package metadata, or Fast React implementation files.
- Keep filenames uniquely under the `react-dom-flush-sync-batching` prefix.
- Generate evidence from exact React DOM 19.2.6 packages using existing conformance patterns where possible.
- Avoid relying on private source internals unless the report clearly labels them as explanatory context, not oracle truth.
- Include deterministic path normalization and local path leak checks.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record progress in `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run the targeted oracle generator/test.
- Run `npm test --workspace @fast-react/conformance` if practical.
- Run scoped whitespace/path/conflict checks over changed files.

Handoff requirements:
- Summarize oracle coverage and intentional gaps.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
