You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless explicitly asked.
Call create_goal for this worker task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM server/static behavior surface oracle files for React DOM 19.2.6.

Write scope:
`tests/conformance/src/react-dom-server-static-*.mjs`
`tests/conformance/scripts/generate-react-dom-server-static-oracle.mjs`
`tests/conformance/scripts/print-react-dom-server-static-oracle.mjs`
`tests/conformance/test/react-dom-server-static-oracle.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-server-static-oracle.json`
`worker-progress/worker-050-react-dom-server-static-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify packages, smoke tests, shared conformance metadata, or root package metadata.
- Use workers 033, 036, and 042.
- Cover server/static export behavior, unsupported placeholder comparison boundaries, basic error/stream shape evidence, and explicit deferred Fizz behavior. Do not implement Fizz.
- Record progress in `worker-progress/worker-050-react-dom-server-static-oracle.md`.

Verification:
- Regenerate the oracle and prove determinism.
- Run the new test and `npm test --workspace @fast-react/conformance`.
- Check local path leaks, trailing whitespace, and scoped diff.

Handoff requirements:
- Summarize oracle coverage and deferred behavior.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
