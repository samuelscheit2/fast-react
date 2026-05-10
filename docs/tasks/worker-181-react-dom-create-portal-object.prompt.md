# Worker 181: React DOM CreatePortal Object

You are worker 181 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-181-react-dom-create-portal-object.md`.

Objective: replace the root `react-dom` createPortal placeholder with a
conformance-backed portal object implementation for valid containers and key
handling, while keeping render/commit behavior unimplemented.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`
- `tests/conformance/src/react-dom-portal-scenarios.mjs`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/src/client/dom-container.js`
- React DOM source reference for `createPortal` as needed.

Write scope:
- `packages/react-dom/src/shared/create-portal.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- Focused tests under `tests/conformance/test/` or `tests/smoke/`
- `worker-progress/worker-181-react-dom-create-portal-object.md`

Do not touch `react-dom/client`, root render/update/unmount internals,
listener/event packages, Rust crates, or generated oracle artifacts unless a
focused test explicitly requires a small target update. You are not alone in
the codebase; do not revert other workers' changes.

Implementation requirements:
- Match React 19.2.6 portal object shape closely enough for focused
  createPortal tests: `$$typeof`, `key`, `children`, `containerInfo`,
  `implementation`, and own-key/descriptors.
- Use existing container validation helpers and preserve accepted invalid
  container error behavior.
- Match key coercion behavior, including Symbol key throwing in production and
  warning behavior in development when practical.
- Keep server/unsupported entrypoints fail-closed as they are today.
- Add tests that compare key portal observations against the accepted oracle
  slices without claiming full compatibility.

Verification:
- `npm run check:js`
- Focused createPortal tests you add or update
- `git diff --check`
