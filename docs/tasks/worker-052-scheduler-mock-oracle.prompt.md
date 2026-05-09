You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless explicitly asked.
Call create_goal for this worker task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic `scheduler/unstable_mock` behavior oracle files for `scheduler@0.27.0`.

Write scope:
`tests/conformance/src/scheduler-mock-*.mjs`
`tests/conformance/scripts/generate-scheduler-mock-oracle.mjs`
`tests/conformance/scripts/print-scheduler-mock-oracle.mjs`
`tests/conformance/test/scheduler-mock-oracle.test.mjs`
`tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json`
`worker-progress/worker-052-scheduler-mock-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify packages, smoke tests, shared conformance metadata, or root package metadata.
- Use worker 034, worker 038, and worker 039.
- Cover virtual time, logs, flush helpers, pending work, disable-yield-value behavior, continuations, resets, and current Fast React placeholder comparison boundaries.
- Do not implement scheduler mock package behavior.
- Record progress in `worker-progress/worker-052-scheduler-mock-oracle.md`.

Verification:
- Regenerate the oracle and prove determinism.
- Run the new test and `npm test --workspace @fast-react/conformance`.
- Check local path leaks, trailing whitespace, and scoped diff.

Handoff requirements:
- Summarize oracle coverage and remaining implementation risks.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
