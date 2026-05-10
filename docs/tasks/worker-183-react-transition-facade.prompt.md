# Worker 183: React Transition Facade

You are worker 183 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-183-react-transition-facade.md`.

Objective: implement a narrow public React `startTransition` facade and
internal transition batch marker that execute callbacks synchronously while
preserving React-like error propagation and export shape for future lane
integration.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-075-core-event-priority.md`
- `worker-progress/worker-131-sync-flush-act-refresh.md`
- `packages/react/index.js`
- `packages/react/placeholder-utils.js`
- React source reference for `startTransition` as needed.

Write scope:
- `packages/react/transition.js`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- Focused tests under `tests/conformance/test/` or `tests/smoke/`
- `worker-progress/worker-183-react-transition-facade.md`

Do not touch Rust lane selection, reconciler scheduling, DOM packages,
test-renderer packages, or hook queue files. You are not alone in the codebase;
do not revert other workers' changes.

Implementation requirements:
- Add `startTransition(scope)` with React-like function shape.
- Execute valid scopes synchronously and return `undefined`.
- Preserve thrown errors from the scope.
- Track whether code is currently inside a transition through a tiny internal
  helper for later scheduler integration.
- Fail clearly for non-function scopes according to observed React 19.2.6
  behavior, or document and test the chosen fail-closed behavior if the exact
  shape is not implemented.
- Add focused tests for export shape, callback execution, nested transitions,
  thrown errors, and non-function input.

Verification:
- `npm run check:js`
- Focused transition tests you add or update
- `git diff --check`
