You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.
When reference source is useful, inspect the local React source clone at `/Users/user/Developer/Developer/react-reference` (`facebook/react` tag `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`). Use npm tarball/runtime oracles for published package behavior claims.

Objective:
Implement `scheduler@0.27.0/unstable_post_task` behavior against the checked post-task oracle, replacing the current placeholder exports with a real postTask-backed scheduler implementation for the local scheduler package. Keep root scheduler, mock scheduler, native scheduler, React lanes, reconciler scheduling, and React DOM integration out of scope.

Write scope:
- `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.production.js`
- `packages/scheduler/unstable_post_task.js`
- `tests/conformance/src/scheduler-post-task-*.mjs`
- `tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-post-task-oracle.mjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-125-scheduler-post-task-implementation.md`

Do not modify:
- `packages/scheduler/cjs/scheduler.development.js`
- `packages/scheduler/cjs/scheduler.production.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.*.js`
- `packages/scheduler/cjs/scheduler.native.*.js`
- `packages/scheduler/index.js`
- `packages/scheduler/index.native.js`
- `packages/scheduler/unstable_mock.js`
- `packages/scheduler/package.json`
- other `tests/smoke/**` files
- any `scheduler-native-entry-*`, `scheduler-mock-*`, or `scheduler-root-*` conformance files
- `crates/**`, `packages/react-dom/**`, `packages/react/**`
- `Cargo.lock`, `package-lock.json`, `node_modules/**`, `target/**`, or generated build output

Context to read after goal setup:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-068-scheduler-post-task-oracle.md`
- `worker-progress/worker-120-scheduler-mock-source-implementation.md`
- `worker-progress/worker-041-dom-events-priority-plan.md` sections about public Scheduler separation
- `/Users/user/Developer/Developer/react-reference/packages/scheduler/src/forks/SchedulerPostTask.js`
- `/Users/user/Developer/Developer/react-reference/packages/scheduler/src/__tests__/SchedulerPostTask-test.js`

Constraints:
- Do not modify files outside your write scope.
- Do not overlap with worker 126's native scheduler entrypoint implementation.
- Implement postTask behavior from the root cause: Task Scheduling API priority mapping, `TaskController` cancellation, priority context restoration, continuation scheduling, `scheduler.yield` fallback behavior, `shouldYield`, and no-op paint/frame-rate APIs.
- Keep public Scheduler priorities separate from React lane and event-priority internals.
- Preserve the local root scheduler and mock scheduler behavior accepted by previous workers.
- Update only the post-task oracle/comparison files needed to compare Fast React against the checked `scheduler@0.27.0/unstable_post_task` behavior. Do not claim broader scheduler package compatibility.
- If the broad JS smoke gate assumes `scheduler/unstable_post_task` imports successfully in plain Node, update `tests/smoke/import-entrypoints.mjs` narrowly to assert the upstream unsupported import behavior for that entrypoint. Do not weaken the postTask implementation or oracle to satisfy smoke.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-125-scheduler-post-task-implementation.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification required:
- `node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js`
- `node --check tests/conformance/src/scheduler-post-task-oracle-generator.mjs`
- `node --check tests/conformance/src/scheduler-post-task-probe-runner.mjs`
- `node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs --write`
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `npm run check:js`
- `git diff --check`
- scoped path, conflict-marker, trailing-whitespace, and placeholder-denylist checks over all changed files

Handoff requirements:
- Summarize implementation.
- List changed files.
- List commands run.
- Include goal evidence.
- Include a prompt-to-artifact checklist.
- List unresolved risks or follow-up tasks.
