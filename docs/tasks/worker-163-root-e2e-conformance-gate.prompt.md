# Worker 163: Root E2E Conformance Gate

You are worker 163 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-163-root-e2e-conformance-gate.md`.

Objective: add a fail-closed conformance gate around the existing React DOM
root render/update/unmount oracle so Fast React cannot accidentally claim root
E2E compatibility before the internal commit/DOM path exists.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-121-root-render-e2e-oracle.md`
- `worker-progress/worker-137-conformance-benchmark-refresh.md`
- `tests/conformance/src/react-dom-root-render-e2e-*`
- `tests/conformance/package.json`

Write scope:
- `tests/conformance/src/react-dom-root-render-e2e-*`
- `tests/conformance/scripts/*root-render-e2e*` only if needed
- `tests/conformance/package.json` only for a focused script
- `worker-progress/worker-163-root-e2e-conformance-gate.md`

Do not change React DOM implementation or Rust code. You are not alone in the
codebase; keep this as a gate/harness worker.

Implementation requirements:
- Add explicit local Fast React target behavior for unsupported root E2E cases
  that fails closed rather than passing placeholders.
- Preserve byte-stable oracle generation.
- Add or adjust a focused test command that compares local output to the React
  19.2.6 oracle only for admitted scenarios.

Verification:
- Focused root E2E conformance command
- `npm run test:conformance`
- `npm run check:js`
- `git diff --check`

