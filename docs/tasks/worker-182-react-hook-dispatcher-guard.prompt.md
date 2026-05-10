# Worker 182: React Hook Dispatcher Guard

You are worker 182 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-182-react-hook-dispatcher-guard.md`.

Objective: replace selected public React hook placeholders with a shared
dispatcher guard that models React's invalid-hook-call boundary without
implementing hook state or rendering.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `worker-progress/worker-099-core-hook-state-queue-plan.md`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- React source reference for `resolveDispatcher` and invalid hook call
  behavior as needed.

Write scope:
- `packages/react/hook-dispatcher.js`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- Focused tests under `tests/conformance/test/` or `tests/smoke/`
- `worker-progress/worker-182-react-hook-dispatcher-guard.md`

Do not touch Rust hook queues, function component render, DOM packages,
test-renderer packages, or scheduler packages. You are not alone in the
codebase; do not revert other workers' changes.

Implementation requirements:
- Add a shared internal dispatcher holder and resolver with a React-like
  invalid hook call error when no dispatcher is installed.
- Wire `useState`, `useReducer`, `useRef`, `useEffect`, `useLayoutEffect`,
  `useMemo`, `useCallback`, `useContext`, and `use` through the dispatcher
  guard where practical.
- Preserve export names/lengths as close to React 19.2.6 as this slice can
  verify.
- Do not implement hook queues, effects, function component render, or
  compatibility claims.
- Add focused tests for invalid hook call errors and dispatcher forwarding with
  a test dispatcher.

Verification:
- `npm run check:js`
- Focused hook dispatcher tests you add or update
- `git diff --check`
