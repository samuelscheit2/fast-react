You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it.
Call create_goal for this worker task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM 19.2.6 client-root public behavior oracle files for `createRoot`, root object `render`/`unmount`, options, warnings/errors, container validation, and current Fast React placeholder comparison boundaries.

Write scope:
`tests/conformance/src/react-dom-client-root-*.mjs`
`tests/conformance/scripts/generate-react-dom-client-root-oracle.mjs`
`tests/conformance/scripts/print-react-dom-client-root-oracle.mjs`
`tests/conformance/test/react-dom-client-root-oracle.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`
`worker-progress/worker-046-react-dom-client-root-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, `tests/conformance/README.md`, `packages/**`, `tests/smoke/**`, or root package metadata.
- Make this oracle self-contained and runnable with direct `node` commands and existing `npm test --workspace @fast-react/conformance`.
- Use worker 036 export oracle and worker 044 client roots plan.
- Do not implement React DOM code.
- Record progress in `worker-progress/worker-046-react-dom-client-root-oracle.md`.

Verification:
- Regenerate the oracle and prove determinism.
- Run the new test and `npm test --workspace @fast-react/conformance`.
- Check local path leaks, trailing whitespace, and scoped diff.

Handoff requirements:
- Summarize oracle coverage and intentional gaps.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
