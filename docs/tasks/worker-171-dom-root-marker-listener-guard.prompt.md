# Worker 171: DOM Root Marker Listener Guard

You are worker 171 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-171-dom-root-marker-listener-guard.md`.

Objective: strengthen private DOM root marker and listener shell tests without
enabling public `createRoot` or dispatching events.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-088-dom-container-root-markers-oracle.md`
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `worker-progress/worker-122-dom-container-listener-shell.md`
- `worker-progress/worker-135-react-dom-root-bridge-refresh.md`
- `packages/react-dom/**`
- `tests/conformance/src/react-dom-container-root-markers-*`
- `tests/conformance/src/react-dom-root-listener-installation-*`

Write scope:
- Private files under `packages/react-dom/`
- Focused JS tests under `tests/smoke/` or `tests/conformance/src/`
- `worker-progress/worker-171-dom-root-marker-listener-guard.md`

Do not expose `createRoot`, install real event plugin dispatch, or touch Rust.
You are not alone in the codebase.

Requirements:
- Keep marker/listener helpers private.
- Add deterministic duplicate-root/listener-once behavior tests if helper code
  exists or can be safely private.
- Assert public placeholders remain unchanged.

Verification:
- Focused JS test command
- `npm run check:js`
- `git diff --check`

