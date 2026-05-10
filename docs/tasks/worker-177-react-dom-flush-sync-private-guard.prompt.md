# Worker 177: React DOM FlushSync Private Guard

You are worker 177 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-177-react-dom-flush-sync-private-guard.md`.

Objective: add private React DOM flushSync guard scaffolding and tests while
the public `flushSync` export remains placeholder-compatible.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`
- `worker-progress/worker-094-root-unmount-flushsync-plan.md`
- `worker-progress/worker-135-react-dom-root-bridge-refresh.md`
- `packages/react-dom/index.js`
- `packages/react-dom/placeholder-utils.js`
- `tests/conformance/src/react-dom-flush-sync-batching-*`

Write scope:
- Private files under `packages/react-dom/`
- Focused JS tests
- `worker-progress/worker-177-react-dom-flush-sync-private-guard.md`

Do not enable public `flushSync`, root unmount, native bridge calls, or Rust
sync flush. You are not alone in the codebase.

Requirements:
- Add a private guard helper for illegal/reentrant flushSync contexts if it can
  be done without public behavior claims.
- Add tests that public `flushSync` placeholder behavior remains unchanged.
- Keep oracle fixtures stable.

Verification:
- Focused JS test command
- `npm run check:js`
- `git diff --check`

