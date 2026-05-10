# Worker 178: Test Renderer Serialization Gate

You are worker 178 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-178-test-renderer-serialization-gate.md`.

Objective: add a fail-closed conformance/test gate for react-test-renderer
serialization so no public serialization compatibility is claimed before the
Rust test-renderer root and commit output exist.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-085-react-test-renderer-serialization-oracle.md`
- `worker-progress/worker-102-test-renderer-serialization-plan.md`
- `worker-progress/worker-133-test-renderer-root-refresh.md`
- `tests/conformance/src/react-test-renderer-serialization-*`
- `tests/conformance/src/react-test-renderer-root-lifecycle-*`

Write scope:
- `tests/conformance/src/react-test-renderer-serialization-*`
- `tests/conformance/src/react-test-renderer-root-lifecycle-*` only if needed
- Focused scripts/package commands if needed
- `worker-progress/worker-178-test-renderer-serialization-gate.md`

Do not implement a JS `react-test-renderer` package facade or Rust serializer.
You are not alone in the codebase.

Requirements:
- Keep React oracle generation stable.
- Add local target checks that fail closed while serialization is unsupported.
- Make future unblocking explicit through admitted scenario metadata or focused
  test names.

Verification:
- Focused test-renderer conformance command
- `npm run test:conformance`
- `npm run check:js`
- `git diff --check`

