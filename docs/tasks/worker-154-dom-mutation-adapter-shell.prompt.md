# Worker 154: DOM Mutation Adapter Shell

You are worker 154 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-154-dom-mutation-adapter-shell.md`.

Objective: add a private DOM mutation adapter shell and tests for primitive
mutation operations without wiring public `createRoot`, events, hydration, or
resource/form behavior.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-134-dom-mutation-refresh.md`
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `packages/react-dom/index.js`
- `packages/react-dom/client.js`
- DOM mutation oracles under `tests/conformance/src/dom-*` as needed.

Write scope:
- New private files under `packages/react-dom/` for DOM mutation helpers
- Focused JS tests or smoke fixtures under `tests/smoke/` or
  `tests/conformance/src/` if consistent with existing patterns
- `worker-progress/worker-154-dom-mutation-adapter-shell.md`

Do not change public `react-dom/client.createRoot`, root markers/listeners,
hydration, event plugin behavior, or Rust reconciler files. You are not alone
in the codebase; keep adapter helpers private and do not revert others.

Implementation requirements:
- Implement or scaffold private operations for append, insert before, remove,
  clear container, text updates, and text-content decision boundaries where
  existing local package style allows.
- Add tests against a fake/minimal DOM-like object model if real jsdom is not
  already a dependency.
- Keep public exports unchanged unless a private deep import is already used.

Verification:
- `npm run check:js`
- Any focused JS test command you add
- `git diff --check`

