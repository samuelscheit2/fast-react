You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
Call create_goal for this worker task. If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM 19.2.6 resource hint API oracle files for `prefetchDNS`, `preconnect`, `preload`, `preloadModule`, `preinit`, and `preinitModule`, including argument normalization, return values, dispatcher absence behavior, and development/production differences.

Write scope:
`tests/conformance/src/react-dom-resource-hints-*.mjs`
`tests/conformance/scripts/*react-dom-resource-hints*.mjs`
`tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-resource-hints-oracle.json`
`worker-progress/worker-059-react-dom-resource-hints-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, shared conformance helpers, package metadata, or Fast React implementation files.
- Keep filenames uniquely under the `react-dom-resource-hints` prefix.
- Generate evidence from exact React DOM 19.2.6 packages using existing conformance patterns where possible.
- Distinguish public observable behavior from private resource dispatcher internals.
- Include deterministic path normalization and local path leak checks.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record progress in `worker-progress/worker-059-react-dom-resource-hints-oracle.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run the targeted oracle generator/test.
- Run `npm test --workspace @fast-react/conformance` if practical.
- Run scoped whitespace/path/conflict checks over changed files.

Handoff requirements:
- Summarize oracle coverage and intentional gaps.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
