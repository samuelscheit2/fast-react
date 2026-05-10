# Worker 184: React Memo Element Type Guard

You are worker 184 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-184-react-memo-element-type-guard.md`.

Objective: add a shared React element-type validation helper and use it to make
`memo` development diagnostics closer to React 19.2.6 without changing render,
hooks, DOM, or scheduler behavior.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `packages/react/wrapper-object.js`
- `packages/react/element-factory.js`
- `tests/conformance/oracles/react-19.2.6-wrapper-object-oracle.json`
- React source reference for `isValidElementType` and `memo` development
  warnings as needed.

Write scope:
- `packages/react/element-type.js`
- `packages/react/wrapper-object.js`
- Focused tests under `tests/conformance/test/` or `tests/smoke/`
- `worker-progress/worker-184-react-memo-element-type-guard.md`

Do not touch React hook dispatcher files, transition files, DOM packages,
Rust crates, scheduler packages, or test-renderer packages. You are not alone
in the codebase; do not revert other workers' changes.

Implementation requirements:
- Add a small shared `isValidElementType` helper for strings, functions, and
  accepted React wrapper/symbol types already modeled by this package.
- Use that helper in `memo` development validation so invalid non-null values
  warn consistently instead of only warning for `null`.
- Preserve existing `memo`, `lazy`, and `forwardRef` object shapes and export
  shapes.
- Keep compatibility claims false; this is a focused diagnostic improvement.
- Add focused tests for valid memo inputs, invalid object/string-like edge
  inputs, and unchanged wrapper object shape.

Verification:
- `npm run check:js`
- Focused memo/type guard tests you add or update
- `git diff --check`
