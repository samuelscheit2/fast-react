# Worker 167: React DOM Private Root Bridge

You are worker 167 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-167-react-dom-private-root-bridge.md`.

Objective: add a private JavaScript root bridge shell for React DOM client root
operations that preserves current public placeholder behavior until the native
and reconciler commit paths are accepted.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-135-react-dom-root-bridge-refresh.md`
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`
- `packages/react-dom/client.js`
- `packages/react-dom/placeholder-utils.js`
- Existing React DOM root oracles under `tests/conformance/src/`.

Write scope:
- Private files under `packages/react-dom/`
- Focused JS tests under `tests/smoke/` or `tests/conformance/src/`
- `worker-progress/worker-167-react-dom-private-root-bridge.md`

Do not enable public `createRoot`, mark containers, install event listeners, or
call native/Rust code. Public exports must remain placeholder-compatible unless
tests prove the current placeholder metadata is preserved. You are not alone in
the codebase.

Implementation requirements:
- Add private root owner/handle shell functions for create/update/unmount
  records.
- Validate containers only if a private helper can do so without public claims.
- Add tests showing public `createRoot` is still unsupported while private
  records are deterministic.

Verification:
- Focused JS test command
- `npm run check:js`
- `git diff --check`

