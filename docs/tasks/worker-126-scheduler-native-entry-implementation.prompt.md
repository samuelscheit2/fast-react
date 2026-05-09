You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.
When reference source is useful, inspect the local React source clone at `/Users/user/Developer/Developer/react-reference` (`facebook/react` tag `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`). Use npm tarball/runtime oracles for published package behavior claims.

Objective:
Implement the `scheduler@0.27.0` native entrypoint behavior against the checked native-entry oracle, replacing the current native placeholder exports with real fallback/nativeRuntimeScheduler delegation behavior. Keep root scheduler, mock scheduler, post-task scheduler, React lanes, reconciler scheduling, React Native renderer integration, and React DOM integration out of scope.

Write scope:
- `packages/scheduler/cjs/scheduler.native.development.js`
- `packages/scheduler/cjs/scheduler.native.production.js`
- `packages/scheduler/index.native.js`
- `tests/conformance/src/scheduler-native-entry-*.mjs`
- `tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-native-entry-oracle.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json`
- `worker-progress/worker-126-scheduler-native-entry-implementation.md`

Do not modify:
- `packages/scheduler/cjs/scheduler.development.js`
- `packages/scheduler/cjs/scheduler.production.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.*.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.*.js`
- `packages/scheduler/index.js`
- `packages/scheduler/unstable_mock.js`
- `packages/scheduler/unstable_post_task.js`
- `packages/scheduler/package.json`
- `tests/smoke/**`
- any `scheduler-post-task-*`, `scheduler-mock-*`, or `scheduler-root-*` conformance files
- `crates/**`, `packages/react-dom/**`, `packages/react/**`
- `Cargo.lock`, `package-lock.json`, `node_modules/**`, `target/**`, or generated build output

Context to read after goal setup:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-069-scheduler-native-entry-oracle.md`
- `worker-progress/worker-120-scheduler-mock-source-implementation.md`
- `worker-progress/worker-041-dom-events-priority-plan.md` sections about public Scheduler separation
- `/Users/user/Developer/Developer/react-reference/packages/scheduler/src/forks/SchedulerNative.js`
- `/Users/user/Developer/Developer/react-reference/packages/scheduler/index.native.js`

Constraints:
- Do not modify files outside your write scope.
- Do not overlap with worker 125's post-task scheduler implementation.
- Implement native entrypoint behavior from the root cause: fallback priority constants, fallback task/cancel behavior, unsupported priority-context helper throwers, `requestPaint`/`shouldYield` behavior, `unstable_now`, and delegation to `globalThis.nativeRuntimeScheduler` when present.
- Keep public Scheduler priorities separate from React lane and event-priority internals.
- Preserve the local root scheduler and mock scheduler behavior accepted by previous workers.
- Update only the native-entry oracle/comparison files needed to compare Fast React against the checked `scheduler@0.27.0` native behavior. Do not claim broader scheduler package compatibility.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-126-scheduler-native-entry-implementation.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification required:
- `node --check packages/scheduler/cjs/scheduler.native.development.js`
- `node --check packages/scheduler/cjs/scheduler.native.production.js`
- `node --check tests/conformance/src/scheduler-native-entry-oracle-generator.mjs`
- `node --check tests/conformance/src/scheduler-native-entry-probe-runner.mjs`
- `node tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs --write`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
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
