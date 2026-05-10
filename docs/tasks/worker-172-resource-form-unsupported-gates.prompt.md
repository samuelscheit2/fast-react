# Worker 172: Resource/Form Unsupported Gates

You are worker 172 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-172-resource-form-unsupported-gates.md`.

Objective: add tests/gates that keep React DOM resources, singletons, form
actions, and controlled form behavior explicitly unsupported until their
private adapter prerequisites exist.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-143-resource-form-refresh.md`
- `worker-progress/worker-059-react-dom-resource-hints-oracle.md`
- `worker-progress/worker-060-react-dom-form-actions-oracle.md`
- `worker-progress/worker-064-dom-controlled-input-oracle.md`
- `packages/react-dom/index.js`
- Relevant conformance resource/form files.

Write scope:
- `tests/conformance/src/react-dom-resource-hints-*`
- `tests/conformance/src/react-dom-form-actions-*`
- `tests/conformance/src/dom-controlled-input-*`
- Focused package/smoke tests if needed
- `worker-progress/worker-172-resource-form-unsupported-gates.md`

Do not implement resource, singleton, form action, event, or controlled input
runtime behavior. You are not alone in the codebase.

Requirements:
- Ensure unsupported public APIs stay placeholder-compatible.
- Add fail-closed tests for accidental enabling or changed arity/metadata.
- Preserve existing React oracle fixtures.

Verification:
- Focused conformance command
- `npm run test:conformance`
- `npm run check:js`
- `git diff --check`

