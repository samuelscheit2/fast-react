# Worker 170: DOM Event Priority Shell

You are worker 170 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-170-dom-event-priority-shell.md`.

Objective: add private DOM event priority wrappers and tests around existing
event-priority oracle behavior without wiring event plugin extraction or
dispatching real events.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-041-dom-events-priority-plan.md`
- `worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `worker-progress/worker-141-event-node-map-refresh.md`
- `packages/react-dom/**`
- `tests/conformance/src/react-dom-event-priority-*`

Write scope:
- Private files under `packages/react-dom/`
- Focused JS tests under `tests/smoke/` or `tests/conformance/src/`
- `worker-progress/worker-170-dom-event-priority-shell.md`

Do not change public exports, root listener installation, reconciler priority
state, or event plugin extraction. You are not alone in the codebase.

Requirements:
- Model discrete/continuous/default event priority mapping privately.
- Keep callbacks inert and deterministic.
- Add tests that assert no public export change.

Verification:
- Focused JS test command
- `npm run check:js`
- `git diff --check`

