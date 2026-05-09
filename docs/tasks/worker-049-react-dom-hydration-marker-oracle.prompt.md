You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless explicitly asked.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM hydration marker and mismatch evidence oracle files.

Write scope:
`tests/conformance/src/react-dom-hydration-marker-*.mjs`
`tests/conformance/scripts/generate-react-dom-hydration-marker-oracle.mjs`
`tests/conformance/scripts/print-react-dom-hydration-marker-oracle.mjs`
`tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`
`worker-progress/worker-049-react-dom-hydration-marker-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify shared conformance metadata, packages, smoke tests, or root package metadata.
- Use workers 033, 042, and 043 plus pinned React DOM/Fizz source evidence.
- Focus on marker/mismatch evidence and contracts; do not implement hydration or DOM code.
- Record progress in `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`.

Verification:
- Regenerate the oracle and prove determinism.
- Run the new test and `npm test --workspace @fast-react/conformance`.
- Check local path leaks, trailing whitespace, and scoped diff.

Handoff requirements:
- Summarize oracle coverage and contracts.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
