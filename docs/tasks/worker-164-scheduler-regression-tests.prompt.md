# Worker 164: Scheduler Regression Tests

You are worker 164 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-164-scheduler-regression-tests.md`.

Objective: add committed local-vs-`scheduler@0.27.0` regression tests for the
public Scheduler package surfaces that already exist locally, without changing
React lanes or reconciler root scheduling internals.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-120-scheduler-mock-source-implementation.md`
- `worker-progress/worker-125-scheduler-post-task-implementation.md`
- `worker-progress/worker-126-scheduler-native-entry-implementation.md`
- `worker-progress/worker-144-scheduler-regression-refresh.md`
- `packages/scheduler/**`
- `tests/conformance/src/scheduler-*`

Write scope:
- `tests/conformance/src/scheduler-*`
- `tests/conformance/scripts/*scheduler*` only if needed
- `packages/scheduler` tests or metadata only if a local test pattern exists
- `worker-progress/worker-164-scheduler-regression-tests.md`

Do not touch Rust reconciler scheduler files or React DOM event priority. You
are not alone in the codebase.

Implementation requirements:
- Add or strengthen tests for priority constants, callback scheduling,
  cancellation, shouldYield, mock flush helpers, native entrypoint, and
  post-task exports as supported.
- Keep unsupported browser post-task ordering claims explicit.
- Do not relax existing conformance expectations.

Verification:
- Focused scheduler conformance command
- `npm run check:js`
- `git diff --check`

