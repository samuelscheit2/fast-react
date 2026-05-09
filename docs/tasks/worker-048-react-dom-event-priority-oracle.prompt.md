You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless explicitly asked.
Call create_goal for this worker task. Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM event-name and update-priority oracle files for React DOM 19.2.6.

Write scope:
`tests/conformance/src/react-dom-event-priority-*.mjs`
`tests/conformance/scripts/generate-react-dom-event-priority-oracle.mjs`
`tests/conformance/scripts/print-react-dom-event-priority-oracle.mjs`
`tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json`
`worker-progress/worker-048-react-dom-event-priority-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, packages, smoke tests, or root package metadata.
- Use worker 041 and pinned React DOM 19.2.6 source/package evidence.
- Cover discrete, continuous, default, idle, `message` under Scheduler priority, `resolveUpdatePriority`, and current Fast React placeholder comparison boundaries.
- Do not implement DOM event code.
- Record progress in `worker-progress/worker-048-react-dom-event-priority-oracle.md`.

Verification:
- Regenerate the oracle and prove determinism.
- Run the new test and `npm test --workspace @fast-react/conformance`.
- Check local path leaks, trailing whitespace, and scoped diff.

Handoff requirements:
- Summarize oracle coverage and timing/source caveats.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
