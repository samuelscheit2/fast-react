# Worker 165: Package Surface Guard

You are worker 165 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-165-package-surface-guard.md`.

Objective: add a small package-surface guard that detects accidental public
export/type changes while root render internals are still being built.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-145-package-surface-refresh.md`
- `worker-progress/worker-035-package-surface-scaffolds.md`
- Root `package.json`
- `packages/react/package.json`
- `packages/react-dom/package.json`
- `packages/scheduler/package.json`
- `tests/smoke/import-entrypoints.mjs`

Write scope:
- `tests/smoke/`
- Package metadata snapshots or fixtures under `tests/` if needed
- Root/package scripts if needed
- `worker-progress/worker-165-package-surface-guard.md`

Do not implement new public React DOM or test-renderer APIs. Do not touch Rust
code. You are not alone in the codebase.

Implementation requirements:
- Snapshot or assert current package `exports`, main files, and placeholder
  metadata for local packages.
- Fail closed on accidental removal or addition of public entrypoints.
- Keep the guard easy to update when orchestrator intentionally accepts a new
  public API.

Verification:
- Focused package surface guard command
- `npm run check:js`
- `git diff --check`

