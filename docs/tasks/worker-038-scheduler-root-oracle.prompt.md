You are a worker for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add deterministic public `scheduler@0.27.0` root behavior oracle files.

Write scope:
`tests/conformance/src/scheduler-root-*.mjs`
`tests/conformance/scripts/generate-scheduler-root-oracle.mjs`
`tests/conformance/scripts/print-scheduler-root-oracle.mjs`
`tests/conformance/test/scheduler-root-oracle.test.mjs`
`tests/conformance/oracles/scheduler-0.27.0-root-oracle.json`
`worker-progress/worker-038-scheduler-root-oracle.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/package.json`, `tests/conformance/README.md`, `packages/**`, `tests/smoke/**`, or root package metadata; other workers own those paths.
- Make this oracle self-contained and runnable with direct `node` commands and existing `npm test --workspace @fast-react/conformance`.
- Use pinned `scheduler@0.27.0` package behavior from worker 034.
- Cover export keys, constants, priority ordering, equal-priority FIFO, delayed callbacks, cancellation, continuations, `didTimeout`, priority context APIs, `shouldYield`, `requestPaint`, `forceFrameRate`, and Node host callback transport evidence.
- Avoid brittle wall-clock assertions; assert logical ordering and timeout categories with generous margins.
- You may include Fast React comparison placeholders only if they do not depend on worker 035 being merged.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-038-scheduler-root-oracle.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification:
- Regenerate the oracle and byte-compare or otherwise prove determinism.
- Run the new oracle test and `npm test --workspace @fast-react/conformance`.
- Check the oracle/report for local temp path leaks and trailing whitespace.

Handoff requirements:
- Summarize oracle coverage and timing caveats.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
