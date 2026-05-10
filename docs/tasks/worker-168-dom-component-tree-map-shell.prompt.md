# Worker 168: DOM Component Tree Map Shell

You are worker 168 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-168-dom-component-tree-map-shell.md`.

Objective: add a private DOM component-tree/latest-props map shell with tests,
without wiring events, public instance lookup, refs, hydration, portals, or DOM
mutation commit.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-141-event-node-map-refresh.md`
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `worker-progress/worker-122-dom-container-listener-shell.md`
- `packages/react-dom/**`
- DOM event/node-map oracles under `tests/conformance/src/` as needed.

Write scope:
- Private files under `packages/react-dom/`
- Focused JS tests under `tests/smoke/` or `tests/conformance/src/`
- `worker-progress/worker-168-dom-component-tree-map-shell.md`

Do not touch public React DOM exports, event plugin extraction, root listener
installation, hydration, or Rust code. Worker 154 and 167 may also add private
React DOM helpers; keep file ownership clear and names specific. You are not
alone in the codebase.

Implementation requirements:
- Implement private attach/detach/get latest props helpers for DOM-like nodes.
- Implement private host instance to fiber/root owner mapping using opaque
  local tokens or symbols.
- Add tests for cleanup on detach, wrong-node lookup, and no public export.

Verification:
- Focused JS test command
- `npm run check:js`
- `git diff --check`

