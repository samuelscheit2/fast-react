You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic React DOM declaration/runtime type-gap inventory files for `@types/react-dom@19.2.3` against React DOM 19.2.6 runtime subpaths.

Write scope:
`tests/conformance/src/react-dom-type-*.mjs`
`tests/conformance/scripts/generate-react-dom-type-inventory.mjs`
`tests/conformance/scripts/print-react-dom-type-inventory.mjs`
`tests/conformance/test/react-dom-type-inventory.test.mjs`
`tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json`
`worker-progress/worker-037-react-dom-type-inventory.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, `tests/conformance/README.md`, `packages/**`, `tests/smoke/**`, or root package metadata; other workers own those paths.
- Make this inventory self-contained and runnable with direct `node` commands and existing `npm test --workspace @fast-react/conformance`.
- Use pinned `@types/react-dom@19.2.3`, `@types/react@19.2.14`, and `react-dom@19.2.6` evidence.
- Separate runtime package compatibility from TypeScript declaration compatibility.
- Capture declaration-only subpaths, runtime-only subpaths, missing runtime declarations such as `profiling`, missing `version` or `resume` declarations, and `react-server` condition gaps.
- If TypeScript compiler API is unavailable, either use a temporary dependency outside the repo or structured declaration parsing that is deterministic; do not add dependencies to package metadata in this worker.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-037-react-dom-type-inventory.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification:
- Regenerate the inventory and byte-compare or otherwise prove determinism.
- Run the new test and `npm test --workspace @fast-react/conformance`.
- Check the inventory/report for local temp path leaks and trailing whitespace.

Handoff requirements:
- Summarize type/runtime gaps and recommended declaration policy.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
